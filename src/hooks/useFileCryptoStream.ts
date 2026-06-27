import { useCallback, useEffect, useState } from "react";

import {
  decryptFileToStream,
  DecryptionError,
  ENCRYPTED_FILE_MIMETYPE,
  encryptFileToStream,
  EncryptionError,
  getEncryptedFileHeader,
  type EncryptedFileHeader,
} from "@/crypt";
import { BufferedWriter } from "@/crypt/bufferio/bufferWriter";
import { downloadBlob } from "@/lib/download";
import { FileCryptoError } from "@/crypt/errors";

type UseFileCryptoOption = {
  maxFileSize: number;
  warnFileSize: number;
  streamSupported: boolean;
};
type FileCryptoState = {
  fileToProcess: File | null;
  progress: number;
  error: string | null;
  warning: string | null;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return (error as Error).name + ": " + error.message;
  }
  throw error;
}

function useFileCrypt(option: UseFileCryptoOption) {
  const [state, setState] = useState<FileCryptoState>({
    fileToProcess: null,
    progress: 0,
    error: null,
    warning: null,
  });
  const isProcessing = state.progress > 0 && state.progress < 1;
  const [saved, setSaved] = useState<boolean>(false);
  const setError = useCallback((message: string | null) => {
    setState((current) => ({
      ...current,
      error: message,
    }));
  }, []);
  const setWarning = useCallback((message: string | null) => {
    setState((current) => ({
      ...current,
      warning: message,
    }));
  }, []);
  const setProgress = useCallback((p: number) => {
    setState((current) => ({
      ...current,
      progress: p,
    }));
  }, []);
  const setFileToProcess = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      if (!file) {
        setState({
          fileToProcess: file,
          progress: 0,
          error: null,
          warning: null,
        });
        setSaved(false);
        return;
      }
      if (!option.streamSupported) {
        if (file.size > option.maxFileSize) {
          setState({
            fileToProcess: null,
            progress: 0,
            error: "large file was selected",
            warning: null,
          });
        } else if (file.size > option.warnFileSize) {
          setState({
            fileToProcess: file,
            progress: 0,
            warning: "large file was selected",
            error: null,
          });
        } else {
          setState({
            fileToProcess: file,
            progress: 0,
            error: null,
            warning: null,
          });
        }
      } else {
        setState({
          fileToProcess: file,
          progress: 0,
          error: null,
          warning: null,
        });
      }
    },
    [option.maxFileSize, option.warnFileSize, option.streamSupported],
  );
  const createOutputWriter = useCallback(
    async (
      filename: string,
    ): Promise<{
      writer: WritableStreamDefaultWriter<Uint8Array>;
      buffer?: BufferedWriter;
    }> => {
      if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
        const writer = (
          await (
            await window.showSaveFilePicker({
              suggestedName: filename,
            })
          ).createWritable()
        ).getWriter();
        return { writer: writer };
      } else {
        const writer = new BufferedWriter();
        return { writer: writer.stream.getWriter(), buffer: writer };
      }
    },
    [],
  );
  return {
    state,
    saved,
    setProgress,
    isProcessing,
    setSaved,
    setError,
    setWarning,
    createOutputWriter,
    setFileToProcess,
  };
}

export function useFileEncrypt(option: UseFileCryptoOption) {
  const {
    state,
    saved,
    isProcessing,
    setProgress,
    createOutputWriter,
    setSaved,
    setError,
    setWarning,
    setFileToProcess,
  } = useFileCrypt(option);

  async function encryptSelectedFile(publicKey: CryptoKey | null) {
    if (!state.fileToProcess || !publicKey) {
      setError("Choose a file and load a public key first.");
      return;
    }

    try {
      const file = state.fileToProcess;
      const input = {
        source: file.stream(),
        filename: file.name,
        fileSize: file.size,
        filetype: file.type,
        publicKey: publicKey,
        onProgress: setProgress,
        onSaved: setSaved,
      };
      const filename = `${file.name}.enc`;
      const { writer, buffer } = await createOutputWriter(filename);
      await encryptFileToStream({ ...input, writer });
      if (buffer) {
        downloadBlob(buffer.toBlob(ENCRYPTED_FILE_MIMETYPE), filename);
      }
      setError(null);
      setWarning(null);
    } catch (error) {
      if (error instanceof EncryptionError || FileCryptoError) {
        setError(getErrorMessage(error));
      }
      throw error;
    }
  }

  return {
    ...option,
    ...state,
    saved,
    isProcessing,
    encryptSelectedFile,
    setFileToProcess,
    setError,
    setWarning,
  };
}

export function useFileDecrypt(option: UseFileCryptoOption) {
  const {
    state,
    saved,
    setProgress,
    isProcessing,
    createOutputWriter,
    setSaved,
    setError,
    setWarning,
    setFileToProcess,
  } = useFileCrypt(option);
  const [originFile, setOriginFile] = useState<EncryptedFileHeader | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    async function updateOrigin(file: File) {
      try {
        const origin = await getEncryptedFileHeader({
          source: file.stream(),
        });
        if (!cancelled) {
          setOriginFile(origin);
        }
      } catch (error) {
        if (!cancelled) {
          if (error instanceof DecryptionError || FileCryptoError) {
            setError(
              "このファイルは暗号化されていないか、暗号情報が破損しているようです",
            );
          }
          setOriginFile(null);
        }
      }
    }
    if (state.fileToProcess) {
      updateOrigin(state.fileToProcess);
    }
    return () => {
      cancelled = true;
    };
  }, [state.fileToProcess, setError]);

  async function setFileToDecrypt(event: React.ChangeEvent<HTMLInputElement>) {
    setOriginFile(null);
    setFileToProcess(event);
  }

  async function decryptSelectedFile(privateKey: CryptoKey | null) {
    if (!state.fileToProcess || !privateKey) {
      setError("Choose a file and load a private key first.");
      return;
    }
    if (!originFile) {
      setError("暗号情報の読み込みが完了していません");
      return;
    }
    try {
      const file = state.fileToProcess!;
      const input = {
        source: file.stream(),
        filename: file.name,
        fileSize: file.size,
        filetype: file.type,
        privateKey: privateKey,
        onProgress: setProgress,
        onSaved: setSaved,
      };
      const filename = originFile?.originalName;
      const { writer, buffer } = await createOutputWriter(filename);
      await decryptFileToStream({ ...input, writer });
      if (buffer) {
        downloadBlob(buffer.toBlob(originFile.originalType), filename);
      }
      setError(null);
      setWarning(null);
    } catch (error) {
      if (error instanceof DecryptionError || FileCryptoError) {
        if ((error as Error).name == "InvalidPrivateKeyError") {
          setError("秘密鍵がファイルに対応していません");
        } else if ((error as Error).name == "AbortError") {
          setError(null);
        } else {
          setError(getErrorMessage(error));
        }
      }
      throw error;
    }
  }

  return {
    ...option,
    ...state,
    saved,
    isProcessing,
    originFile,
    decryptSelectedFile,
    setFileToDecrypt,
    setError,
    setWarning,
  };
}
