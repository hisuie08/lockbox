import {
  type KeyAgreementKeyType,
  exportAsJwk,
  getJwkThumbprint,
} from "@/crypt";
import { ref, watch, readonly, type Ref } from "vue";

export type KeyState = ReturnType<typeof createKeyState>;

export function createKeyState(keyType: KeyAgreementKeyType) {
  const key = ref<CryptoKey | null>(null);
  const jwk = useJwk(key);
  const thumbprint = useThumbprint(key);
  return { keyType, key, jwk, thumbprint };
}

function useJwk(key: Ref<CryptoKey | null>) {
  const jwk = ref<JsonWebKey | null>(null);
  watch(key, async () => {
    jwk.value = key.value ? await exportAsJwk(key.value) : null;
  });
  return readonly(jwk);
}

function useThumbprint(key: Ref<CryptoKey | null>) {
  const thumbprint = ref("");
  watch(key, async () => {
    thumbprint.value = key.value ? await getJwkThumbprint(key.value) : "";
  });
  return readonly(thumbprint);
}
