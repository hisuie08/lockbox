import { ref, computed } from "vue";
import {
  exportAsJwk,
  importJwk,
  getJwkThumbprint,
  toPublicJwk,
  type KeyAgreementKeyType,
  genKeyPair,
} from "@/crypt";
import { useWithErrors } from "./useWithErrors";
import { createKeyState } from "./useKeyState";


export function useCryptoKeys() {
  const state = { public: createKeyState("public"), private: createKeyState("private") }
  const isGenerating = ref(false)
  const { error, withKeyPairError } = useWithErrors();

  const mismatchKeys = computed(
    () =>
      state.public.thumbprint.value !== state.private.thumbprint.value &&
      state.public.thumbprint.value !== "" &&
      state.private.thumbprint.value !== "",
  );

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
