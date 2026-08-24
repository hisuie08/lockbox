import { reactive, toRefs } from "vue";
import {
  parseJwk,
  X25519,
  type KeyAgreementKeyType,
  type X25519JwkValidationResult,
} from "@/crypt";
type ValidJwkState = X25519JwkValidationResult & {
  keyType: KeyAgreementKeyType;
};
type LoadKeyState = {
  jwk: ValidJwkState | null;
  errors: string[];
};

export function useKeyLoad() {
  const state = reactive<LoadKeyState>({
    jwk: null,
    errors: [],
  });

  function validate(input: string) {
    try {
      state.jwk = null;
      state.errors = [];
      if (!input) {
        return;
      }

      const parsed = parseJwk(input);
      const result = X25519.validate(parsed);
      if (!result.valid) {
        state.jwk = null;
        state.errors.push(...result.errors);
        return;
      }

      // if (result.keyType !== keyType) {
      //   state.jwk = null;
      //   state.errors.push(
      //     `invalid key type. this is ${result.keyType} key. paste ${keyType} key instead`,
      //   );
      //   return;
      // }
      state.jwk = result;
      state.errors = [];
      return;
    } catch (error) {
      state.jwk = null;
      state.errors.push(error instanceof Error ? error.message : String(error));
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
    loadKeyString,
    loadKeyFile,
  };
}
