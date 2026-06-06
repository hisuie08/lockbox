import { useEffect, useMemo, useState } from "react";

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
  const publicKeyText = useMemo(
    () => JSON.stringify(state.publicJwk),
    [state.publicJwk],
  );
  const privateKeyText = useMemo(
    () => JSON.stringify(state.privateJwk),
    [state.privateJwk],
  );
  useEffect(() => {
    const update = async () => {
      if (state.publicKey) {
        const fp = await getJwkThumbPrint(state.publicKey);
        setPubFinger(fp);
      } else {
        setPubFinger("");
      }
    };
    update();
  }, [state.publicKey]);
  const [privateKeyThumbprint, setPrivFinger] = useState<string>("");
  useEffect(() => {
    const update = async () => {
      if (state.privateKey) {
        const fp = await getJwkThumbPrint(state.privateKey);
        setPrivFinger(fp);
      } else {
        setPrivFinger("");
      }
    };
    update();
  }, [state.privateKey]);

  async function generateKeys() {
    setState((current) => ({ ...current, isGenerating: true, error: null }));

    try {
      const keyPair = await genKeyPair();
      const date = new Date();
      const [publicJwk, privateJwk]: [LockBoxJwk, LockBoxJwk] =
        await Promise.all([
          exportKey(keyPair.publicKey, date),
          exportKey(keyPair.privateKey, date),
        ]);
      setState({
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        publicJwk: publicJwk,
        privateJwk: privateJwk,
        isGenerating: false,
        error: null,
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        isGenerating: false,
        error: getErrorMessage(error),
      }));
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
    privateKeyText,
    publicKeyText,
    clearPublicKey,
    clearPrivateKey,
    generateKeys,
    importPrivateJwk,
    importPublicJwk,
    setError,
  };
}
