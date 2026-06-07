import {
  parseJwk,
  validateRsaJwk,
  type RsaJwkValidationResult,
} from "@/crypt/services";
import React, { useMemo, useState } from "react";

export type TypeKeyFor = "public" | "private";
export type LoadKeyState = {
  jwk: RsaJwkValidationResult | null;
  error: string;
};
export function useKeyLoad(keyType: TypeKeyFor) {
  const [state, setState] = useState<LoadKeyState>({
    jwk: null,
    error: "",
  });

  const isValid = useMemo(() => {
    return (
      state.jwk != null && state.jwk?.valid && state.jwk.keyType == keyType
    );
  }, [state.jwk, keyType]);

  const validJwk = useMemo(() => {
    return state.jwk?.valid ? state.jwk.jwk : null;
  }, [state.jwk]);

  function loadKeyString(event: React.ChangeEvent<HTMLTextAreaElement>) {
    try {
      const keystr = event.target.value;
      validate(keystr);
    } catch (e) {
      setState({ jwk: null, error: e as string });
    }
  }

  function loadKeyFile(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const r = e.target?.result as string;
        validate(r);
      };
      reader.readAsText(file);
    }
  }
  function validate(input: string) {
    try {
      if (!input) {
        setState({ jwk: null, error: "" });
        return;
      }
      const parsed = parseJwk(input);
      const k = validateRsaJwk(parsed);

      if (!k.valid) {
        setState({ jwk: null, error: k.errors.join(";") });
        return;
      }
      if (k.keyType != keyType) {
        setState({
          jwk: null,
          error: `invalid key type. this is ${k.keyType} key. paste ${keyType} key instead`,
        });
      } else {
        setState({ jwk: k, error: "" });
      }
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : (e as string);
      setState({ jwk: null, error: err });
    }
  }
  return {
    error: state.error,
    isValid,
    validJwk,
    loadKeyFile,
    loadKeyString,
  };
}
