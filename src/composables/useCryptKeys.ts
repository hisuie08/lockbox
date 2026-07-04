import { reactive, ref, computed, watchEffect } from "vue";
import {
  exportAsJwk,
  genKeyPair,
  importJwk,
  getJwkThumbprint,
  toPublicJwk,
  KeyPairError,
} from "@/crypt";

type CryptoKeyState = {
  publicKey: CryptoKey | null;
  privateKey: CryptoKey | null;
  publicJwk: JsonWebKey | null;
  privateJwk: JsonWebKey | null;
  isGenerating: boolean;
  error: string | null;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return `${error.name}: ${error.message}`;
  }
  throw error;
}

export function useCryptoKeys() {
  const state = reactive<CryptoKeyState>({
    publicKey: null,
    privateKey: null,
    publicJwk: null,
    privateJwk: null,
    isGenerating: false,
    error: null,
  });

  const publicKeyThumbprint = ref("");
  const privateKeyThumbprint = ref("");
  watchEffect(async () => {
    publicKeyThumbprint.value = state.publicJwk
      ? await getJwkThumbprint(state.publicJwk)
      : "";
  });

  watchEffect(async () => {
    privateKeyThumbprint.value = state.privateJwk
      ? await getJwkThumbprint(state.privateJwk)
      : "";
  });
  const mismatchKeys = computed(
    () =>
      publicKeyThumbprint.value !== privateKeyThumbprint.value &&
      publicKeyThumbprint.value !== "" &&
      privateKeyThumbprint.value !== "",
  );

  async function generateKeys() {
    state.isGenerating = true;
    state.error = null;

    try {
      const keyPair = await genKeyPair();

      const [publicJwk, privateJwk] = await Promise.all([
        exportAsJwk(keyPair.publicKey),
        exportAsJwk(keyPair.privateKey),
      ]);

      state.isGenerating = false;

      return { publicJwk, privateJwk };
    } catch (error) {
      state.isGenerating = false;

      if (error instanceof KeyPairError) {
        state.error = getErrorMessage(error);
        return {
          publicJwk: null,
          privateJwk: null,
        };
      }

      throw error;
    }
  }

  async function importPublicJwk(jwk: JsonWebKey) {
    try {
      state.publicKey = await importJwk(jwk, "public");
      state.publicJwk = jwk;
      state.error = null;
    } catch (error) {
      if (error instanceof KeyPairError) {
        state.error = getErrorMessage(error);
      }
      throw error;
    }
  }

  async function importPrivateJwk(jwk: JsonWebKey) {
    try {
      state.privateKey = await importJwk(jwk, "private");
      state.privateJwk = jwk;
      state.error = null;
    } catch (error) {
      if (error instanceof KeyPairError) {
        state.error = getErrorMessage(error);
      }
      throw error;
    }
  }

  async function importBothJwk(privateJwk: JsonWebKey) {
    await importPrivateJwk(privateJwk);

    try {
      await importPublicJwk(toPublicJwk(privateJwk));
    } catch (error) {
      if (error instanceof KeyPairError) {
        state.error = getErrorMessage(error);
      }
      throw error;
    }
  }

  function clearPublicKey() {
    state.publicKey = null;
    state.publicJwk = null;
    state.error = null;
  }

  function clearPrivateKey() {
    state.privateKey = null;
    state.privateJwk = null;
    state.error = null;
  }

  function setError(error: string) {
    state.error = error;
  }

  return {
    ...state,
    mismatchKeys,
    publicKeyThumbprint,
    privateKeyThumbprint,
    getThumbPrint: getJwkThumbprint,
    clearPublicKey,
    clearPrivateKey,
    generateKeys,
    importPrivateJwk,
    importPublicJwk,
    importBothJwk,
    setError,
  };
}