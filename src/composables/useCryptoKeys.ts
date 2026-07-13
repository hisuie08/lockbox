import { reactive, ref, computed, watchEffect, toRefs, readonly, type Ref } from "vue";
import {
  exportAsJwk,
  genKeyPair,
  importJwk,
  getJwkThumbprint,
  toPublicJwk,
  KeyPairError,
  type KeyAgreementKeyType,
} from "@/crypt";

type CryptoKeyState = {
  publicKey: CryptoKey | null;
  privateKey: CryptoKey | null;
};

type KeyState = {
  keyType: KeyAgreementKeyType
  key: Ref<CryptoKey | null>;
  jwk: Readonly<Ref<JsonWebKey | null>>;
  thumbprint: Readonly<Ref<string>>;
}

function createKeyState(keyType: KeyAgreementKeyType): KeyState {
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

function useJwk(key: Ref<CryptoKey | null>): Readonly<Ref<JsonWebKey | null>> {
  const jwk = ref<JsonWebKey | null>(null);
  watchEffect(async () => {
    jwk.value = key.value ? await exportAsJwk(key.value) : null;
  })
  return jwk
}

function useThumbprint(jwk: Ref<CryptoKey | null>) {
  const thumbprint = ref("");
  watchEffect(async () => {
    thumbprint.value = jwk.value
      ? await getJwkThumbprint(jwk.value)
      : "";
  });
  return readonly(thumbprint);
}


export function useCryptoKeys() {
  const state = reactive<CryptoKeyState>({
    publicKey: null,
    privateKey: null,
  });
  const keyStates = { public: createKeyState("public"), private: createKeyState("private") }
  const isGenerating = ref(false);
  const error = ref<string | null>(null)
  const publicKey = ref<CryptoKey | null>(null)
  const privateKey = ref<CryptoKey | null>(null)
  const publicJwk = useJwk(publicKey)
  const privateJwk = useJwk(privateKey)
  const publicKeyThumbprint = useThumbprint(publicKey);
  const privateKeyThumbprint = useThumbprint(privateKey);

  const mismatchKeys = computed(
    () =>
      keyStates.public.thumbprint.value !== keyStates.private.thumbprint.value &&
      keyStates.public.thumbprint.value !== "" &&
      keyStates.private.thumbprint.value !== "",
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
  
  async function generateKeys() {
    await withKeyPairError(genKey, () => {
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
    keyStates[keyType].key.value = key;
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
    keyStates[keyType].key.value = null;
    error.value = null;
  }
  const clearPublicKey = () => clear("public");
  const clearPrivateKey = () => clear("private");

  function setError(err: string) {
    error.value = err;
  }

  return {
    ...toRefs(state),
    mismatchKeys,
    publicJwk,
    privateJwk,
    publicKeyThumbprint,
    privateKeyThumbprint,
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
