import { reactive, computed, toRefs, ref, watchEffect, shallowRef } from "vue";
import {
  decryptFile,
  DecryptionError,
  encryptFile,
  getEncryptedFileHeader,
  type EncryptedFileHeader,
} from "@/crypt";
import { FileCryptoError } from "@/crypt";
import { registerDownload } from "@/lib/registerDownload";
import { CancelableWriter } from "@/lib/writer/cancelableWriter";
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
  const currentController = shallowRef<AbortController | null>(null);
  function cancel() {
    currentController.value?.abort();
  }
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
    state.fileToProcess = file;
  }

  return {
    keyState,
    ...toRefs(state),
    isProcessing,
    setFile,
    cancel,
    internal: { setError, setProgress, getDownloadWriter, currentController },
  };
}

export function useFileEncrypt(publicKey: KeyState) {
  const fileCrypt = useFileCrypt(publicKey);
  const { internal, ...fc } = fileCrypt;

  async function encryptSelectedFile() {
    const publicKey = fc.keyState.key.value;
    const file = fileCrypt.fileToProcess.value;
    if (!file || !publicKey) {
      internal.setError("Choose a file and load a public key first.");
      return;
    }
    try {
      const input = {
        source: file.stream(),
        filename: file.name,
        fileSize: file.size,
        filetype: file.type,
        publicKey: publicKey,
        onProgress: internal.setProgress,
      };
      const encFileName = `${file.name}.enc`;
      const controller = new AbortController();
      internal.currentController.value = controller;
      const { writer, signal: downloadSignal } =
        await internal.getDownloadWriter(encFileName);
      const signal = AbortSignal.any([controller.signal, downloadSignal]);
      await encryptFile(
        {
          ...input,
          writer,
        },
        signal,
      );
      internal.setError(null);
    } catch (error) {
      if ((error as Error).name == "AbortError") {
        internal.setError("キャンセルされました");
        fileCrypt.progress.value = 0;
      }
      if (error instanceof FileCryptoError) {
        internal.setError(getErrorMessage(error));
      }
      throw error;
    }
  }
  return {
    ...fc,
    encryptSelectedFile,
  };
}

export function useFileDecrypt(privateKey: KeyState) {
  const fileCrypt = useFileCrypt(privateKey);
  const { internal, ...fc } = fileCrypt;
  const originFile = ref<EncryptedFileHeader | null>(null);
  watchEffect(async () => {
    originFile.value = null;
    const file = fileCrypt.fileToProcess.value;
    if (!file) {
      return;
    }
    try {
      originFile.value = await getEncryptedFileHeader({
        source: file.stream(),
      });
      internal.setError(null);
    } catch (error) {
      originFile.value = null;
      if (
        error instanceof DecryptionError ||
        error instanceof FileCryptoError
      ) {
        internal.setError(
          "このファイルは暗号化されていないか、暗号情報が破損しているようです",
        );
      } else {
        throw error;
      }
    }
  });

  async function decryptSelectedFile() {
    const privateKey = fc.keyState.key.value;
    const file = fileCrypt.fileToProcess.value;
    if (!file || !privateKey) {
      internal.setError("Choose a file and load a private key first.");
      return;
    }

    if (!originFile.value) {
      internal.setError("暗号情報の読み込みが完了していません");
      return;
    }
    try {
      const input = {
        source: file.stream(),
        filename: file.name,
        fileSize: file.size,
        filetype: file.type,
        privateKey,
        onProgress: internal.setProgress,
      };

      const filename = originFile.value.originalName;
      const controller = new AbortController();
      internal.currentController.value = controller;
      const { writer, signal: downloadSignal } =
        await internal.getDownloadWriter(filename);
      const signal = AbortSignal.any([controller.signal, downloadSignal]);

      await decryptFile(
        {
          ...input,
          writer,
        },
        signal,
      );

      internal.setError(null);
    } catch (error) {
      if ((error as Error).name == "AbortError") {
        internal.setError("キャンセルされました");
        fileCrypt.progress.value = 0;
      }
      if (
        error instanceof DecryptionError ||
        error instanceof FileCryptoError
      ) {
        switch (error.name) {
          case "InvalidPrivateKeyError":
            internal.setError("秘密鍵がファイルに対応していません");
            break;
          default:
            internal.setError(getErrorMessage(error));
            break;
        }
      }

      throw error;
    }
  }

  return {
    ...fc,
    originFile,
    decryptSelectedFile,
  };
}
