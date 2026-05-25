import { useState } from "react"

import {
  exportPrivateKey,
  exportPublicKey,
  formatJwk,
  genKeyPair,
  importPrivateKey,
  importPublicKey,
  parseJwk,
} from "@/crypt/services/genKeyPair"

type CryptoKeyState = {
  publicKey: CryptoKey | null
  privateKey: CryptoKey | null
  publicKeyText: string
  privateKeyText: string
  isGenerating: boolean
  error: string | null
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return "Key operation failed."
}

export function useCryptoKeys() {
  const [state, setState] = useState<CryptoKeyState>({
    publicKey: null,
    privateKey: null,
    publicKeyText: "",
    privateKeyText: "",
    isGenerating: false,
    error: null,
  })

  async function generateKeys() {
    setState((current) => ({ ...current, isGenerating: true, error: null }))

    try {
      const keyPair = await genKeyPair()
      const [publicJwk, privateJwk] = await Promise.all([
        exportPublicKey(keyPair.publicKey),
        exportPrivateKey(keyPair.privateKey),
      ])

      setState({
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        publicKeyText: formatJwk(publicJwk),
        privateKeyText: formatJwk(privateJwk),
        isGenerating: false,
        error: null,
      })
    } catch (error) {
      setState((current) => ({
        ...current,
        isGenerating: false,
        error: getErrorMessage(error),
      }))
    }
  }

  async function importPublicKeyText() {
    try {
      const publicKey = await importPublicKey(parseJwk(state.publicKeyText))
      setState((current) => ({ ...current, publicKey, error: null }))
    } catch (error) {
      setState((current) => ({ ...current, error: getErrorMessage(error) }))
    }
  }

  async function importPrivateKeyText() {
    try {
      const privateKey = await importPrivateKey(parseJwk(state.privateKeyText))
      setState((current) => ({ ...current, privateKey, error: null }))
    } catch (error) {
      setState((current) => ({ ...current, error: getErrorMessage(error) }))
    }
  }

  function setPublicKeyText(publicKeyText: string) {
    setState((current) => ({
      ...current,
      publicKey: null,
      publicKeyText,
      error: null,
    }))
  }

  function setPrivateKeyText(privateKeyText: string) {
    setState((current) => ({
      ...current,
      privateKey: null,
      privateKeyText,
      error: null,
    }))
  }

  function clearPrivateKey() {
    setState((current) => ({
      ...current,
      privateKey: null,
      privateKeyText: "",
      error: null,
    }))
  }

  return {
    ...state,
    clearPrivateKey,
    generateKeys,
    importPrivateKeyText,
    importPublicKeyText,
    setPrivateKeyText,
    setPublicKeyText,
  }
}
