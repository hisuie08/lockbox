import {
  parseJwk,
  validateX25519Jwk,
  type X25519JwkValidationResult,
} from "@/crypt/services";
import React, { useState } from "react";

export type TypeKeyFor = "public" | "private";
export type LoadKeyState = {
  jwk: X25519JwkValidationResult | null;
  error: string;
};
export function useKeyLoad(keyType: TypeKeyFor) {
  const [state, setState] = useState<LoadKeyState>({
    jwk: null,
    error: "",
  });

  const isValid =
    state.jwk != null && state.jwk?.valid && state.jwk.keyType == keyType;

  const validJwk = state.jwk?.valid ? state.jwk.jwk : null;

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
      const k = validateX25519Jwk(parsed);

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
