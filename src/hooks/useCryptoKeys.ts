import { useEffect, useMemo, useState } from "react";

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
    return (error as Error).name + ": " + error.message;
  }
  throw error;
}

export function useCryptoKeys() {
  const [state, setState] = useState<CryptoKeyState>({
    publicKey: null,
    privateKey: null,
    publicJwk: null,
    privateJwk: null,
    isGenerating: false,
    error: null,
  });
  const [publicKeyThumbprint, setPubFinger] = useState<string>("");
  useEffect(() => {
    const update = async () => {
      if (state.publicJwk) {
        const fp = await getJwkThumbprint(state.publicJwk);
        setPubFinger(fp);
      } else {
        setPubFinger("");
      }
    };
    update();
  }, [state.publicJwk]);
  const [privateKeyThumbprint, setPrivFinger] = useState<string>("");
  useEffect(() => {
    const update = async () => {
      if (state.privateJwk) {
        const tp = await getJwkThumbprint(state.privateJwk);
        setPrivFinger(tp);
      } else {
        setPrivFinger("");
      }
    };
    update();
  }, [state.privateJwk]);

  const mismatchKeys = useMemo(
    () =>
      publicKeyThumbprint !== privateKeyThumbprint &&
      publicKeyThumbprint != "" &&
      privateKeyThumbprint != "",
    [privateKeyThumbprint, publicKeyThumbprint],
  );

  async function generateKeys(): Promise<{
    publicJwk: JsonWebKey | null;
    privateJwk: JsonWebKey | null;
  }> {
    setState((current) => ({ ...current, isGenerating: true, error: null }));
    try {
      const keyPair = await genKeyPair();
      const [publicJwk, privateJwk]: [JsonWebKey, JsonWebKey] =
        await Promise.all([
          exportAsJwk(keyPair.publicKey),
          exportAsJwk(keyPair.privateKey),
        ]);
      setState((current) => ({ ...current, isGenerating: false, error: null }));
      return { publicJwk: publicJwk, privateJwk: privateJwk };
    } catch (error) {
      if (error instanceof KeyPairError) {
        setState((current) => ({
          ...current,
          isGenerating: false,
          error: getErrorMessage(error),
        }));
        return { publicJwk: null, privateJwk: null };
      }
      throw error;
    }
  }

  async function importPublicJwk(jwk: JsonWebKey) {
    try {
      const publicKey = await importJwk(jwk, "public");
      setState((current) => ({
        ...current,
        publicKey: publicKey,
        publicJwk: jwk,
        error: null,
      }));
    } catch (error) {
      if (error instanceof KeyPairError) {
        setState((current) => ({ ...current, error: getErrorMessage(error) }));
      }
      throw error;
    }
  }

  async function importPrivateJwk(jwk: JsonWebKey) {
    try {
      const privateKey = await importJwk(jwk, "private");
      setState((current) => ({
        ...current,
        privateKey: privateKey,
        privateJwk: jwk,
        error: null,
      }));
    } catch (error) {
      if (error instanceof KeyPairError) {
        setState((current) => ({ ...current, error: getErrorMessage(error) }));
      }
      throw error;
    }
  }

  async function importBothJwk(privateJwk: JsonWebKey) {
    importPrivateJwk(privateJwk);
    try {
      const publicJwk = toPublicJwk(privateJwk);
      importPublicJwk(publicJwk);
    } catch (error) {
      if (error instanceof KeyPairError) {
        setState((current) => ({ ...current, error: getErrorMessage(error) }));
      }
      throw error;
    }
  }

  function clearPublicKey() {
    setState((current) => ({
      ...current,
      publicKey: null,
      publicJwk: null,
      error: null,
    }));
  }
  function clearPrivateKey() {
    setState((current) => ({
      ...current,
      privateKey: null,
      privateJwk: null,
      error: null,
    }));
  }

  function setError(error: string) {
    setState((current) => ({ ...current, error: error }));
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
