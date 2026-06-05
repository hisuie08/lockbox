import { useEffect, useState } from "react";

import {
  canonicalizeRsaJwk,
  exportPrivateKey,
  exportPublicKey,
  genKeyPair,
  getJwkThumbPrint,
  importPrivateKey,
  importPublicKey,
  parseJwk,
} from "@/crypt/services/genKeyPair";

type CryptoKeyState = {
  publicKey: CryptoKey | null;
  privateKey: CryptoKey | null;
  publicKeyText: string;
  privateKeyText: string;
  isGenerating: boolean;
  error: string | null;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Key operation failed.";
}

export function useCryptoKeys() {
  const [state, setState] = useState<CryptoKeyState>({
    publicKey: null,
    privateKey: null,
    publicKeyText: "",
    privateKeyText: "",
    isGenerating: false,
    error: null,
  });

  const [publicKeyThumbprint, setPubFinger] = useState<string>("");
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
      const [publicJwk, privateJwk] = await Promise.all([
        exportPublicKey(keyPair.publicKey),
        exportPrivateKey(keyPair.privateKey),
      ]);
      setState({
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        publicKeyText: canonicalizeRsaJwk(publicJwk),
        privateKeyText: JSON.stringify(privateJwk),
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

  async function importPublicKeyText() {
    try {
      const publicKey = await importPublicKey(parseJwk(state.publicKeyText));
      setState((current) => ({ ...current, publicKey, error: null }));
    } catch (error) {
      setState((current) => ({ ...current, error: getErrorMessage(error) }));
    }
  }

  async function importPrivateKeyText() {
    try {
      const privateKey = await importPrivateKey(parseJwk(state.privateKeyText));
      setState((current) => ({ ...current, privateKey, error: null }));
    } catch (error) {
      setState((current) => ({ ...current, error: getErrorMessage(error) }));
    }
  }
  function setPublicKeyText(publicKeyText: string) {
    setState((current) => ({
      ...current,
      publicKeyText,
      error: null,
    }));
  }

  function setPrivateKeyText(privateKeyText: string) {
    setState((current) => ({
      ...current,
      privateKeyText,
      error: null,
    }));
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

  return {
    ...state,
    publicKeyThumbprint,
    privateKeyThumbprint,
    clearPublicKey,
    clearPrivateKey,
    generateKeys,
    importPrivateKeyText,
    importPublicKeyText,
    setPrivateKeyText,
    setPublicKeyText,
  };
}
