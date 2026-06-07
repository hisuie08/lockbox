import { useEffect, useState } from "react";

import {
  exportKey,
  genKeyPair,
  importPrivateKey,
  importPublicKey,
  getJwkThumbPrint,
  type LockBoxJwk,
} from "@/crypt/services";

type CryptoKeyState = {
  publicKey: CryptoKey | null;
  privateKey: CryptoKey | null;
  publicJwk: LockBoxJwk | null;
  privateJwk: LockBoxJwk | null;
  isGenerating: boolean;
  error: string | null;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  } else if (error instanceof Array) {
    return error.join(";");
  }

  return "Key operation failed.";
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
        const fp = await getJwkThumbPrint(state.publicJwk);
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
        const tp = await getJwkThumbPrint(state.privateJwk);
        setPrivFinger(tp);
      } else {
        setPrivFinger("");
      }
    };
    update();
  }, [state.privateJwk]);

  async function generateKeys(): Promise<{
    publicJwk: LockBoxJwk | null;
    privateJwk: LockBoxJwk | null;
  }> {
    setState((current) => ({ ...current, isGenerating: true, error: null }));
    try {
      const keyPair = await genKeyPair();
      const date = new Date();
      const [publicJwk, privateJwk]: [LockBoxJwk, LockBoxJwk] =
        await Promise.all([
          exportKey(keyPair.publicKey, date),
          exportKey(keyPair.privateKey, date),
        ]);
      setState((current) => ({ ...current, isGenerating: false, error: null }));
      return { publicJwk: publicJwk, privateJwk: privateJwk };
    } catch (error) {
      setState((current) => ({
        ...current,
        isGenerating: false,
        error: getErrorMessage(error),
      }));
      return { publicJwk: null, privateJwk: null };
    }
  }

  async function importPublicJwk(jwk: LockBoxJwk) {
    try {
      const publicKey = await importPublicKey(jwk);
      setState((current) => ({
        ...current,
        publicKey: publicKey,
        publicJwk: jwk,
        error: null,
      }));
    } catch (error) {
      setState((current) => ({ ...current, error: getErrorMessage(error) }));
    }
  }

  async function importPrivateJwk(jwk: LockBoxJwk) {
    try {
      const privateKey = await importPrivateKey(jwk);
      setState((current) => ({
        ...current,
        privateKey: privateKey,
        privateJwk: jwk,
        error: null,
      }));
    } catch (error) {
      setState((current) => ({ ...current, error: getErrorMessage(error) }));
    }
  }

  function clearPublicKey() {
    setState((current) => ({
      ...current,
      publicKey: null,
      publicKeyText: "",
      error: null,
    }));
  }
  function clearPrivateKey() {
    setState((current) => ({
      ...current,
      privateKey: null,
      privateKeyText: "",
      error: null,
    }));
  }

  function setError(error: string) {
    setState((current) => ({ ...current, error: error }));
  }

  return {
    ...state,
    publicKeyThumbprint,
    privateKeyThumbprint,
    getThumbPrint: getJwkThumbPrint,
    clearPublicKey,
    clearPrivateKey,
    generateKeys,
    importPrivateJwk,
    importPublicJwk,
    setError,
  };
}
