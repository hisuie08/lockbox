import { useEffect, useState } from "react";

import {
  exportPrivateKey,
  exportPublicKey,
  formatJwk,
  genKeyPair,
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

  const [publicKeyFingerprint, setPubFinger] = useState<string>("");
  useEffect(() => {
    const update = async () => {
      if (state.publicKey) {
        const fp = await getFingerPrint(state.publicKey);
        setPubFinger(fp);
      }
    };
    update();
  }, [state.publicKey]);
  const [privateKeyFingerprint, setPrivFinger] = useState<string>("");
  useEffect(() => {
    const update = async () => {
      if (state.privateKey) {
        const fp = await getFingerPrint(state.privateKey);
        setPrivFinger(fp);
      }
    };
    update();
  }, [state.privateKey]);
  async function getFingerPrint(key: CryptoKey): Promise<string> {
    const exported = await exportPublicKey(key);
    const requiredMembers = { e: exported.e, kty: exported.kty, n: exported.n };
    const jwkString = formatJwk(requiredMembers);
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(jwkString),
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return btoa(hashArray.map((b) => String.fromCharCode(b)).join(""));
  }

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
        publicKeyText: formatJwk(publicJwk),
        privateKeyText: formatJwk(privateJwk),
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
    publicKeyFingerprint,
    privateKeyFingerprint,
    clearPrivateKey,
    generateKeys,
    importPrivateKeyText,
    importPublicKeyText,
    setPrivateKeyText,
    setPublicKeyText,
  };
}
