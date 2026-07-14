import type { KeyAgreementKeyType } from "@/crypt";
import { downloadText } from "@/lib/download";
import { useClipboard } from "@vueuse/core";
import { ref } from "vue";
import { toast } from "vue-sonner";

export type GeneratedKeyHandle = ReturnType<typeof createGeneratedKeyHandle>;
function createGeneratedKeyHandle(keyType: KeyAgreementKeyType) {
  const { copied, copy: _copy } = useClipboard();
  const jwk = ref<JsonWebKey | null>(null);
  const isSaved = ref(false);
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
  return { keyType, copied, jwk, isSaved, copy, download };
}

export function useKeyGenerations() {
  const pubKey = createGeneratedKeyHandle("public");
  const privKey = createGeneratedKeyHandle("private");
  function init() {
    pubKey.isSaved.value = false;
    privKey.isSaved.value = false;
  }

  return {
    pubKey,
    privKey,
    init,
  };
}
