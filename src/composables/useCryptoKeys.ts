import {  ref, computed, readonly, type Ref, watch } from "vue";
import {
  exportAsJwk,
  genKeyPair,
  importJwk,
  getJwkThumbprint,
  toPublicJwk,
  KeyPairError,
  type KeyAgreementKeyType,
} from "@/crypt";


export type KeyState = ReturnType<typeof createKeyState>;

function createKeyState(keyType: KeyAgreementKeyType){
  const key = ref<CryptoKey | null>(null)
  const jwk = useJwk(key)
  const thumbprint = useThumbprint(key);
  return { keyType, key, jwk, thumbprint }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return `${error.name}: ${error.message}`;
  }
  throw error;
}

function useJwk(key: Ref<CryptoKey | null>){
  const jwk = ref<JsonWebKey | null>(null);
  watch(key,async () => {
    jwk.value = key.value ? await exportAsJwk(key.value) : null;
  })
  return readonly(jwk)
}

function useThumbprint(key: Ref<CryptoKey | null>) {
  const thumbprint = ref("");
  watch(key,async () => {
    thumbprint.value = key.value
      ? await getJwkThumbprint(key.value)
      : "";
  });
  return readonly(thumbprint);
}

export function useCryptoKeys() {
  const state = { public: createKeyState("public"), private: createKeyState("private") }
  const isGenerating = ref(false);
  const error = ref<string | null>(null)

  const mismatchKeys = computed(
    () =>
      state.public.thumbprint.value !== state.private.thumbprint.value &&
      state.public.thumbprint.value !== "" &&
      state.private.thumbprint.value !== "",
  );

  async function withKeyPairError<T>(
    fn: () => Promise<T>, onErr?: (err: any) => void, onFinally?: () => void
  ): Promise<T> {
    try {
      error.value = null;
      return await fn();
    } catch (err) {
      if (err instanceof KeyPairError) {
        error.value = getErrorMessage(err);
        if (onErr) onErr(err);
      }
      throw err;
    } finally { if (onFinally) onFinally() }
  }

  async function genKey() {
    isGenerating.value = true;
    error.value = null;
    const keyPair = await genKeyPair();
    const [publicJwk, privateJwk] = await Promise.all([
      exportAsJwk(keyPair.publicKey),
      exportAsJwk(keyPair.privateKey),
    ]);
    isGenerating.value = false;
    return { publicJwk, privateJwk };
  }

  async function generateKeys(){
    return withKeyPairError(genKey, () => {
      return {
        publicJwk: null,
        privateJwk: null,
      }
    }, () => { isGenerating.value = false })
  }

  async function importKey(
    jwk: JsonWebKey,
    keyType: KeyAgreementKeyType,
  ) {
    const key = await importJwk(jwk, keyType);
    state[keyType].key.value = key;
  }
  async function importPublicJwk(jwk: JsonWebKey) {
    await withKeyPairError(async () => {
      await importKey(jwk, "public");
    });
  }
  async function importPrivateJwk(
    jwk: JsonWebKey,
    withPublic = false,
  ) {
    await withKeyPairError(async () => {
      await importKey(jwk, "private");
      if (withPublic) {
        await importKey(toPublicJwk(jwk), "public");
      }
    });
  }

  function clear(keyType: KeyAgreementKeyType) {
    state[keyType].key.value = null;
    error.value = null;
  }
  const clearPublicKey = () => clear("public");
  const clearPrivateKey = () => clear("private");

  function setError(err: string) {
    error.value = err;
  }

  return {
    ...state,
    mismatchKeys,
    isGenerating,
    error,
    getThumbPrint: getJwkThumbprint,
    clearPublicKey,
    clearPrivateKey,
    generateKeys,
    importPrivateJwk,
    importPublicJwk,
    setError,
  };
}
