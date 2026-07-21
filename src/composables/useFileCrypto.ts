import { reactive, computed, toRefs, ref, watchEffect } from "vue";
import {
  decryptFile,
  DecryptionError,
  encryptFile,
  getEncryptedFileHeader,
  type EncryptedFileHeader,
} from "@/crypt";
import { FileCryptoError } from "@/crypt/errors";
import { registerDownload } from "@/lib/registerDownload";
import { CancelableWriter } from "@/crypt/cancelableWriter";
import type { KeyState } from "./useKeyState";
type FileCryptoState = {
  fileToProcess: File | null;
  progress: number;
  error: string | null;
};
function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return (error as Error).name + ": " + error.message;
  }
  throw error;
}

function useFileCrypt(keyState: KeyState) {
  const state = reactive<FileCryptoState>({
    fileToProcess: null,
    progress: 0,
    error: null,
  });

  const isProcessing = computed(() => state.progress > 0 && state.progress < 1);

  function setError(message: string | null) {
    state.error = message;
  }

  function setProgress(progress: number) {
    state.progress = progress;
  }

  async function getDownloadWriter(filename: string) {
    const pipe = new TransformStream<Uint8Array, Uint8Array>();

    const reg = await registerDownload({
      stream: pipe.readable,
      filename: filename,
    });
    const a: HTMLAnchorElement = document.createElement("a");
    a.href = reg.url;
    a.click();

    const writer = new CancelableWriter(pipe.writable.getWriter(), reg.signal);
    return { writer, ...reg };
  }

  async function setFile(file: File | null) {
    state.progress = 0;
    state.error = null;

    if (!file) {
      state.fileToProcess = null;
      return;
    }
    state.fileToProcess = file;
  }

  return {
    keyState,
    ...toRefs(state),
    state,
    isProcessing,
    setError,
    setProgress,
    setFile,
    getDownloadWriter,
  };
}

export function useFileEncrypt(publicKey: KeyState) {
  const fileCrypt = useFileCrypt(publicKey);

  async function encryptSelectedFile(publicKey: CryptoKey | null) {
    if (!fileCrypt.state.fileToProcess || !publicKey) {
      fileCrypt.setError("Choose a file and load a public key first.");
      return;
    }

    try {
      const file = fileCrypt.state.fileToProcess;

      const encFileName = `${file.name}.enc`;
      const input = {
        source: file.stream(),
        filename: file.name,
        fileSize: file.size,
        filetype: file.type,
        publicKey: publicKey,
        onProgress: fileCrypt.setProgress,
      };

      const { writer, signal } = await fileCrypt.getDownloadWriter(encFileName);
      await encryptFile(
        {
          ...input,
          writer,
        },
        signal,
      );
      fileCrypt.setError(null);
    } catch (error) {
      if ((error as Error).name == "AbortError") {
        fileCrypt.setError("キャンセルされました");
        fileCrypt.progress.value = 0;
      }
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

export function useFileDecrypt(privateKey: KeyState) {
  const fileCrypt = useFileCrypt(privateKey);

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
      };

      const filename = originFile.value.originalName;

      const { writer, signal } = await fileCrypt.getDownloadWriter(filename);

      await decryptFile(
        {
          ...input,
          writer,
        },
        signal,
      );

      fileCrypt.setError(null);
    } catch (error) {
      if ((error as Error).name == "AbortError") {
        fileCrypt.setError("キャンセルされました");
        fileCrypt.progress.value = 0;
      }
      if (
        error instanceof DecryptionError ||
        error instanceof FileCryptoError
      ) {
        switch (error.name) {
          case "InvalidPrivateKeyError":
            fileCrypt.setError("秘密鍵がファイルに対応していません");
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
