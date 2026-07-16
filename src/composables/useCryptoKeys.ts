import { computed } from "vue";
import { importJwk, toPublicJwk, type KeyAgreementKeyType } from "@/crypt";
import { useWithErrors } from "./useWithErrors";
import { createKeyState, type KeyState } from "./useKeyState";
import { useKeyGenerations } from "./useKeyGeneration";
export { type GeneratedKeyHandle } from "./useKeyGeneration";

export type KeyHandle = KeyState & {
  importJwk(jwk: JsonWebKey, withPublic?: boolean): Promise<void>;
  clear(): void;
};

export function useCryptoKeys() {
  const state = {
    public: createKeyState("public"),
    private: createKeyState("private"),
  };
  const { isGenerating, genKey, ...generator } = useKeyGenerations();
  const { error, withKeyPairError } = useWithErrors();

  const mismatchKeys = computed(
    () =>
      state.public.thumbprint.value !== state.private.thumbprint.value &&
      state.public.thumbprint.value !== "" &&
      state.private.thumbprint.value !== "",
  );

  async function generateKeys() {
    return withKeyPairError(
      async () => {
        return genKey(error);
      },
      () => {},
      () => {
        isGenerating.value = false;
      },
    );
  }

  async function importKey(jwk: JsonWebKey, keyType: KeyAgreementKeyType) {
    const key = await importJwk(jwk, keyType);
    state[keyType].key.value = key;
  }
  async function importPublicJwk(jwk: JsonWebKey) {
    await withKeyPairError(async () => {
      await importKey(jwk, "public");
    });
  }
  async function importPrivateJwk(jwk: JsonWebKey, withPublic = false) {
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

  const publicHandle: KeyHandle = {
    ...state.public,
    importJwk: importPublicJwk,
    clear: () => clear("public"),
  };
  const privateHandle: KeyHandle = {
    ...state.private,
    importJwk: importPrivateJwk,
    clear: () => clear("private"),
  };

  return {
    public: publicHandle,
    private: privateHandle,
    mismatchKeys,
    isGenerating,
    error,
    generateKeys,
    generator,
  };
}
