import { downloadText } from "@/lib/download";
import { useClipboard } from "@vueuse/core";
import { ref } from "vue";
import { toast } from "vue-sonner";
export function useKeyGeneration(keyType: "public" | "private") {
  const { copied, copy: _copy } = useClipboard();
  const jwk = ref<JsonWebKey | null>(null);
  const isSaved = ref(false);
  const isPrivate = keyType == "private";
  function setSaved() {
    isSaved.value = true;
  }
  async function copy() {
    try {
      await _copy(JSON.stringify(jwk.value));
      isSaved.value = true;
      toast.info(`${keyType} key was copied`);
    } catch {
      toast.error("Clipboard permission was blocked.");
    }
  }
  function download() {
    const fileName =
      keyType == "public"
        ? "lockbox-public-key.jwk.json"
        : "lockbox-private-key.jwk.json";
    downloadText(JSON.stringify(jwk.value), fileName);
    isSaved.value = true;
  }
  return {
    jwk,
    isPrivate,
    isSaved,
    setSaved,
    keyType,
    copy,
    copied,
    download,
  };
}
export function useKeyGenerations() {
  const pubKey = useKeyGeneration("public");
  const privKey = useKeyGeneration("private");
  return {
    pubKey,
    privKey,
  };
}
