import { reactive, computed, toRefs } from "vue";
import {
  parseJwk,
  validateX25519Jwk,
  type KeyAgreementKeyType,
  type X25519JwkValidationResult,
} from "@/crypt";

type LoadKeyState = {
  jwk: X25519JwkValidationResult | null;
  error: string;
};

export function useKeyLoad(keyType: KeyAgreementKeyType) {
  const state = reactive<LoadKeyState>({
    jwk: null,
    error: "",
  });

  const isValid = computed(
    () => state.jwk !== null && state.jwk.valid && state.jwk.keyType == keyType,
  );

  const validJwk = computed(() => (state.jwk?.valid ? state.jwk.jwk : null));

  function validate(input: string) {
    try {
      if (!input) {
        state.jwk = null;
        state.error = "";
        return;
      }

      const parsed = parseJwk(input);
      const result = validateX25519Jwk(parsed);

      if (!result.valid) {
        state.jwk = null;
        state.error = result.errors.join(";");
        return;
      }

      if (result.keyType !== keyType) {
        state.jwk = null;
        state.error = `invalid key type. this is ${result.keyType} key. paste ${keyType} key instead`;
        return;
      }

      state.jwk = result;
      state.error = "";
      return;
    } catch (error) {
      state.jwk = null;
      state.error = error instanceof Error ? error.message : String(error);
    }
  }

  function loadKeyString(text: string) {
    validate(text);
  }

  async function loadKeyFile(file: File | null) {
    if (!file) {
      return;
    }

    validate(await file.text());
  }

  return {
    ...toRefs(state),
    isValid,
    validJwk,
    loadKeyString,
    loadKeyFile,
  };
}
