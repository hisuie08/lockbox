import { reactive, computed, toRefs, ref, watchEffect } from "vue";
import type { useStreamSupport } from "./useStreamSupport";
import {
  decryptFile,
  DecryptionError,
  encryptFile,
  getEncryptedFileHeader,
  type EncryptedFileHeader,
} from "@/crypt";
import { FileCryptoError } from "@/crypt/errors";
import { registerDownload } from "@/lib/registerDownload";
type UseFileCryptoOption = {
  warnFileSize: number;
  streamSupport: ReturnType<typeof useStreamSupport>;
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
  const state = reactive<FileCryptoState & { saved: boolean }>({
    fileToProcess: null,
    progress: 0,
    error: null,
    warning: null,
    saved: false,
  });

  const isProcessing = computed(() => state.progress > 0 && state.progress < 1);

  function setError(message: string | null) {
    state.error = message;
  }

  function setWarning(message: string | null) {
    state.warning = message;
  }

  function setProgress(progress: number) {
    state.progress = progress;
  }

  function setSaved(saved: boolean) {
    state.saved = saved;
  }

  async function getDownloadWriter(filename: string) {
    const pipe = new TransformStream<Uint8Array, Uint8Array>();

    const url = await registerDownload({
      stream: pipe.readable,
      filename: filename,
    });
    const a: HTMLAnchorElement = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    const writer = pipe.writable.getWriter();
    return writer;
  }

  async function setFile(file: File | null) {
    state.saved = false;
    state.progress = 0;
    state.error = null;
    state.warning = null;

    if (!file) {
      state.fileToProcess = null;
      return;
    }

    if (!option.streamSupport.isSupported) {
      if (file.size > option.warnFileSize) {
        state.warning = "大きなファイルの操作はChromeを推奨します";
      }
    }

    state.fileToProcess = file;
  }

  return {
    ...option,
    ...toRefs(state),
    state,
    isProcessing,
    setError,
    setWarning,
    setProgress,
    setSaved,
    setFile,
    createOutputWriter: getDownloadWriter,
  };
}

export function useFileEncrypt(option: UseFileCryptoOption) {
  const fileCrypt = useFileCrypt(option);

  async function encryptSelectedFile(publicKey: CryptoKey | null) {
    if (!fileCrypt.state.fileToProcess || !publicKey) {
      fileCrypt.setError("Choose a file and load a public key first.");
      return;
    }

    try {
      const file = fileCrypt.state.fileToProcess;

      const filename = `${file.name}.enc`;
      const input = {
        source: file.stream(),
        filename: filename,
        fileSize: file.size,
        filetype: file.type,
        publicKey: publicKey,
        onProgress: fileCrypt.setProgress,
        onSaved: fileCrypt.setSaved,
      };
      const pipe = new TransformStream<Uint8Array, Uint8Array>();
      const url = await registerDownload({
        stream: pipe.readable,
        filename: filename,
      });
      const a: HTMLAnchorElement = document.createElement("a");
      a.href = url;
      a.click();
      const writer = pipe.writable.getWriter();
      await encryptFile({
        ...input,
        writer,
      });
      fileCrypt.setError(null);
      fileCrypt.setWarning(null);
    } catch (error) {
      if (error instanceof FileCryptoError) {
        fileCrypt.setError(getErrorMessage(error));
      }
      throw error;
    }
  }

  return {
    ...fileCrypt,
    encryptSelectedFile,
  };
}

export function useFileDecrypt(option: UseFileCryptoOption) {
  const fileCrypt = useFileCrypt(option);

  const originFile = ref<EncryptedFileHeader | null>(null);

  watchEffect(async () => {
    originFile.value = null;

    const file = fileCrypt.state.fileToProcess;
    if (!file) {
      return;
    }

    try {
      originFile.value = await getEncryptedFileHeader({
        source: file.stream(),
      });

      fileCrypt.setError(null);
    } catch (error) {
      originFile.value = null;

      if (
        error instanceof DecryptionError ||
        error instanceof FileCryptoError
      ) {
        fileCrypt.setError(
          "このファイルは暗号化されていないか、暗号情報が破損しているようです",
        );
      } else {
        throw error;
      }
    }
  });

  async function decryptSelectedFile(privateKey: CryptoKey | null) {
    const file = fileCrypt.state.fileToProcess;

    if (!file || !privateKey) {
      fileCrypt.setError("Choose a file and load a private key first.");
      return;
    }

    if (!originFile.value) {
      fileCrypt.setError("暗号情報の読み込みが完了していません");
      return;
    }
    try {
      const input = {
        source: file.stream(),
        filename: file.name,
        fileSize: file.size,
        filetype: file.type,
        privateKey,
        onProgress: fileCrypt.setProgress,
        onSaved: fileCrypt.setSaved,
      };

      const filename = originFile.value.originalName;

      const writer = await fileCrypt.createOutputWriter(filename);

      await decryptFile({
        ...input,
        writer,
      });

      fileCrypt.setError(null);
      fileCrypt.setWarning(null);
    } catch (error) {
      if (
        error instanceof DecryptionError ||
        error instanceof FileCryptoError
      ) {
        switch (error.name) {
          case "InvalidPrivateKeyError":
            fileCrypt.setError("秘密鍵がファイルに対応していません");
            break;

          case "AbortError":
            fileCrypt.setError(null);
            break;

          default:
            fileCrypt.setError(getErrorMessage(error));
            break;
        }
      }

      throw error;
    }
  }

  return {
    ...fileCrypt,
    originFile,
    decryptSelectedFile,
  };
}
