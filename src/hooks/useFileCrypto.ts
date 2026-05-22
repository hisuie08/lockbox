import { useEffect, useRef, useState } from "react"

import { decryptFile } from "@/crypt/services/decrypt"
import { encryptFile } from "@/crypt/services/encrypt"

type FileResult = {
  blob: Blob
  filename: string
  url: string
}

type FileCryptoState = {
  fileToEncrypt: File | null
  fileToDecrypt: File | null
  encryptedResult: FileResult | null
  decryptedResult: FileResult | null
  isEncrypting: boolean
  isDecrypting: boolean
  error: string | null
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "File operation failed."
}

function toFileResult(blob: Blob, filename: string): FileResult {
  return {
    blob,
    filename,
    url: URL.createObjectURL(blob),
  }
}

export function useFileCrypto() {
  const encryptedResultRef = useRef<FileResult | null>(null)
  const decryptedResultRef = useRef<FileResult | null>(null)
  const [state, setState] = useState<FileCryptoState>({
    fileToEncrypt: null,
    fileToDecrypt: null,
    encryptedResult: null,
    decryptedResult: null,
    isEncrypting: false,
    isDecrypting: false,
    error: null,
  })

  useEffect(() => {
    encryptedResultRef.current = state.encryptedResult
  }, [state.encryptedResult])

  useEffect(() => {
    decryptedResultRef.current = state.decryptedResult
  }, [state.decryptedResult])

  useEffect(() => {
    return () => {
      if (encryptedResultRef.current) {
        URL.revokeObjectURL(encryptedResultRef.current.url)
      }

      if (decryptedResultRef.current) {
        URL.revokeObjectURL(decryptedResultRef.current.url)
      }
    }
  }, [])

  function setFileToEncrypt(file: File | null) {
    setState((current) => ({ ...current, fileToEncrypt: file, error: null }))
  }

  function setFileToDecrypt(file: File | null) {
    setState((current) => ({ ...current, fileToDecrypt: file, error: null }))
  }

  async function encryptSelectedFile(publicKey: CryptoKey | null) {
    if (!state.fileToEncrypt || !publicKey) {
      setState((current) => ({
        ...current,
        error: "Choose a file and load a public key first.",
      }))
      return
    }

    setState((current) => ({ ...current, isEncrypting: true, error: null }))

    try {
      const result = await encryptFile({
        file: state.fileToEncrypt,
        publicKey,
      })

      setState((current) => {
        if (current.encryptedResult) {
          URL.revokeObjectURL(current.encryptedResult.url)
        }

        return {
          ...current,
          encryptedResult: toFileResult(result.blob, result.filename),
          isEncrypting: false,
          error: null,
        }
      })
    } catch (error) {
      setState((current) => ({
        ...current,
        isEncrypting: false,
        error: getErrorMessage(error),
      }))
    }
  }

  async function decryptSelectedFile(privateKey: CryptoKey | null) {
    if (!state.fileToDecrypt || !privateKey) {
      setState((current) => ({
        ...current,
        error: "Choose an encrypted file and load a private key first.",
      }))
      return
    }

    setState((current) => ({ ...current, isDecrypting: true, error: null }))

    try {
      const result = await decryptFile({
        file: state.fileToDecrypt,
        privateKey,
      })

      setState((current) => {
        if (current.decryptedResult) {
          URL.revokeObjectURL(current.decryptedResult.url)
        }

        return {
          ...current,
          decryptedResult: toFileResult(result.blob, result.filename),
          isDecrypting: false,
          error: null,
        }
      })
    } catch (error) {
      setState((current) => ({
        ...current,
        isDecrypting: false,
        error: getErrorMessage(error),
      }))
    }
  }

  return {
    ...state,
    decryptSelectedFile,
    encryptSelectedFile,
    setFileToDecrypt,
    setFileToEncrypt,
  }
}
