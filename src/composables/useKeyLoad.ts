import { ref, type Ref } from "vue";
import {
  KeyImportError,
  parseJwk,
  X25519,
  type KeyAgreementKeyType,
} from "@/crypt";

export type LoadedKeyHandle = {
  valid: Ref<boolean>;
  jwk: Ref<JsonWebKey | null>;
  keyType: Ref<KeyAgreementKeyType | null>;
  errors: Ref<Array<string>>;
  loadKeyString: (keyString: string) => void;
  loadKeyFile: (keyFile: File | null) => void;
};
export function useKeyLoad(): LoadedKeyHandle {
  const valid = ref<boolean>(false);
  const jwk = ref<JsonWebKey | null>(null);
  const keyType = ref<KeyAgreementKeyType | null>(null);
  const errors = ref<Array<string>>([]);
  function setInvalid() {
    jwk.value = null;
    keyType.value = null;
    valid.value = false;
  }
  async function validate(input: string) {
    try {
      setInvalid();
      if (!input) {
        return;
      }

      const parsed = parseJwk(input);
      const result = X25519.validate(parsed);
      if (!result.valid) {
        setInvalid();
        errors.value.push(...result.errors);
        return;
      }
      try {
        await X25519.importJwk(result.jwk, result.keyType);
      } catch (error) {
        if (error instanceof KeyImportError) {
          setInvalid();
          errors.value.push("invalid Key Data");
        }
        return;
      }

      jwk.value = result.jwk;
      keyType.value = result.keyType;
      valid.value = true;
      errors.value = [];
      return;
    } catch (error) {
      setInvalid();
      errors.value.push(error instanceof Error ? error.message : String(error));
    }
  }

  async function loadKeyString(text: string) {
    await validate(text);
  }

  async function loadKeyFile(file: File | null) {
    if (!file) {
      return;
    }

    await validate(await file.text());
  }
  return {
    valid,
    jwk,
    keyType,
    errors,
    loadKeyString,
    loadKeyFile,
  };
}
