import { X25519, type KeyAgreementKeyType } from "@/crypt";
import { downloadText } from "@/lib/download";
import { useClipboard } from "@vueuse/core";
import { ref, type Ref } from "vue";
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
  const isGenerating = ref(false);
  const generatedPubKey = createGeneratedKeyHandle("public");
  const generatedPrivKey = createGeneratedKeyHandle("private");
  function init() {
    generatedPubKey.isSaved.value = false;
    generatedPrivKey.isSaved.value = false;
  }
  async function genKey(error: Ref<string | null>) {
    isGenerating.value = true;
    init();
    error.value = null;
    const keyPair = await X25519.generate();
    const [publicJwk, privateJwk] = await Promise.all([
      X25519.exportAsJwk(keyPair.publicKey),
      X25519.exportAsJwk(keyPair.privateKey),
    ]);
    isGenerating.value = false;
    generatedPubKey.jwk.value = publicJwk;
    generatedPrivKey.jwk.value = privateJwk;
  }
  return {
    isGenerating,
    generatedPubKey,
    generatedPrivKey,
    genKey,
    init,
  };
}
