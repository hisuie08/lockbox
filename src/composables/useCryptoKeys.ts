import { computed } from "vue";
import { X25519, type KeyAgreementKeyType } from "@/crypt";
import { useWithErrors } from "./useWithErrors";
import { createKeyState, type KeyState } from "./useKeyState";
import { useKeyGenerations } from "./useKeyGeneration";
export { type GeneratedKeyHandle } from "./useKeyGeneration";

export type KeyHandle = KeyState & {
  importJwk(
    jwk: JsonWebKey,
    keyType: KeyAgreementKeyType,
    withPublic?: boolean,
  ): Promise<void>;
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

  async function importKey(
    jwk: JsonWebKey,
    keyType: KeyAgreementKeyType,
    withPublic = true,
  ) {
    await withKeyPairError(async () => {
      const key = await X25519.importJwk(jwk, keyType);
      state[keyType].key.value = key;
      if (withPublic && keyType == "private") {
        const key = await X25519.importJwk(X25519.toPublicJwk(jwk), "public");
        state["public"].key.value = key;
      }
    });
  }

  function clear(keyType: KeyAgreementKeyType) {
    state[keyType].key.value = null;
    error.value = null;
  }

  const publicHandle: KeyHandle = {
    ...state.public,
    importJwk: importKey,
    clear: () => clear("public"),
  };
  const privateHandle: KeyHandle = {
    ...state.private,
    importJwk: importKey,
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
