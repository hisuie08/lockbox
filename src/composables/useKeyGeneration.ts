import { X25519, type KeyAgreementKeyType } from "@/crypt";
import { ref, type Ref } from "vue";
import { useKeyState, type KeyState } from "./useKeyState";

export type GeneratedKeyHandle = KeyState & {
  isSaved: Ref<boolean>;
  download: () => void;
};

function useGeneratedKeyHandle(
  keyType: KeyAgreementKeyType,
): GeneratedKeyHandle {
  const keyState = useKeyState(keyType);
  const isSaved = ref(false);

  function download() {
    const fileName = `lockbox-${keyType}-key.jwk.json`;
    const blob: Blob = new Blob([JSON.stringify(keyState.jwk.value)], {
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
  return { ...keyState, isSaved, download };
}

export function useKeyGenerations() {
  const isGenerating = ref(false);
  const generatedPubKey = useGeneratedKeyHandle("public");
  const generatedPrivKey = useGeneratedKeyHandle("private");
  function init() {
    generatedPubKey.isSaved.value = false;
    generatedPrivKey.isSaved.value = false;
  }
  async function genKey(error: Ref<string | null>) {
    isGenerating.value = true;
    init();
    error.value = null;
    const keyPair = await X25519.generate();
    generatedPubKey.key.value = keyPair.publicKey;
    generatedPrivKey.key.value = keyPair.privateKey;
    isGenerating.value = false;
  }
  return {
    isGenerating,
    generatedPubKey,
    generatedPrivKey,
    genKey,
  };
}
