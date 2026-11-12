import { X25519, type KeyAgreementKeyType } from "@/crypt";
import { ref, type Ref } from "vue";

export type GeneratedKeyHandle = ReturnType<typeof createGeneratedKeyHandle>;
function createGeneratedKeyHandle(keyType: KeyAgreementKeyType) {
  const jwk = ref<JsonWebKey | null>(null);
  const isSaved = ref(false);

  function download() {
    const fileName = `lockbox-${keyType}-key.jwk.json`;
    const blob: Blob = new Blob([JSON.stringify(jwk.value)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    isSaved.value = true;
  }
  return { keyType, jwk, isSaved,download };
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
