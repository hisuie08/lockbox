import { useEffect, useRef, useState } from "react";

import { decryptFile } from "@/crypt/services/decrypt";
import { encryptFile } from "@/crypt/services/encrypt";
import { formatBytes } from "@/lib/unit";
export type FileResult = {
  blob: Blob;
  filename: string;
  url: string;
};

type FileCryptoState = {
  fileToEncrypt: File | null;
  fileToDecrypt: File | null;
  encryptedResult: FileResult | null;
  decryptedResult: FileResult | null;
  isEncrypting: boolean;
  isDecrypting: boolean;
  error: string | null;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "File operation failed.";
}

function toFileResult(blob: Blob, filename: string): FileResult {
  return {
    blob,
    filename,
    url: URL.createObjectURL(blob),
  };
}

export function useFileCrypto() {
  const encryptedResultRef = useRef<FileResult | null>(null);
  const decryptedResultRef = useRef<FileResult | null>(null);
  const [state, setState] = useState<FileCryptoState>({
    fileToEncrypt: null,
    fileToDecrypt: null,
    encryptedResult: null,
    decryptedResult: null,
    isEncrypting: false,
    isDecrypting: false,
    error: null,
  });

  useEffect(() => {
    encryptedResultRef.current = state.encryptedResult;
  }, [state.encryptedResult]);

  useEffect(() => {
    decryptedResultRef.current = state.decryptedResult;
  }, [state.decryptedResult]);

  useEffect(() => {
    return () => {
      if (encryptedResultRef.current) {
        URL.revokeObjectURL(encryptedResultRef.current.url);
      }

      if (decryptedResultRef.current) {
        URL.revokeObjectURL(decryptedResultRef.current.url);
      }
    };
  }, []);

  function setError(message: string) {
    setState((current) => {
      return {
        ...current,
        error: message,
      };
    });
  }

  function setFileToEncrypt(maxFileSize: number, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (file && file.size > maxFileSize) {
      setError(`File size exceeds the limit of ${formatBytes(maxFileSize)}.`);
      event.target.value = "";
      return;
    }
    setState((current) => {
      if (current.encryptedResult) {
        URL.revokeObjectURL(current.encryptedResult.url);
      }

      return {
        ...current,
        encryptedResult: null,
        fileToEncrypt: file,
        error: null,
      };
    });
  }

  function setFileToDecrypt(maxFileSize: number, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (file && file.size > maxFileSize) {
      setError(`File size exceeds the limit of ${formatBytes(maxFileSize)}.`);
      event.target.value = "";
      return;
    }
    setState((current) => {
      if (current.decryptedResult) {
        URL.revokeObjectURL(current.decryptedResult.url);
      }

      return {
        ...current,
        decryptedResult: null,
        fileToDecrypt: file,
        error: null,
      };
    });
  }

  async function encryptSelectedFile(publicKey: CryptoKey | null) {
    if (!state.fileToEncrypt || !publicKey) {
      setState((current) => ({
        ...current,
        error: "Choose a file and load a public key first.",
      }));
      return;
    }

    setState((current) => {
      if (current.encryptedResult) {
        URL.revokeObjectURL(current.encryptedResult.url);
      }

      return {
        ...current,
        encryptedResult: null,
        isEncrypting: true,
        error: null,
      };
    });

    try {
      const result = await encryptFile({
        file: state.fileToEncrypt,
        publicKey,
      });

      setState((current) => {
        if (current.encryptedResult) {
          URL.revokeObjectURL(current.encryptedResult.url);
        }

        return {
          ...current,
          encryptedResult: toFileResult(result.blob, result.filename),
          isEncrypting: false,
          error: null,
        };
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        isEncrypting: false,
        error: getErrorMessage(error),
      }));
    }
  }

  async function decryptSelectedFile(privateKey: CryptoKey | null) {
    if (!state.fileToDecrypt || !privateKey) {
      setState((current) => ({
        ...current,
        error: "Choose an encrypted file and load a private key first.",
      }));
      return;
    }

    setState((current) => {
      if (current.decryptedResult) {
        URL.revokeObjectURL(current.decryptedResult.url);
      }

      return {
        ...current,
        decryptedResult: null,
        isDecrypting: true,
        error: null,
      };
    });

    try {
      const result = await decryptFile({
        file: state.fileToDecrypt,
        privateKey,
      });

      setState((current) => {
        if (current.decryptedResult) {
          URL.revokeObjectURL(current.decryptedResult.url);
        }

        return {
          ...current,
          decryptedResult: toFileResult(result.blob, result.filename),
          isDecrypting: false,
          error: null,
        };
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        isDecrypting: false,
        error: getErrorMessage(error),
      }));
    }
  }

  return {
    ...state,
    decryptSelectedFile,
    encryptSelectedFile,
    setFileToDecrypt,
    setFileToEncrypt,
    setError,
  };
}
