import { type KeyAgreementKeyType, X25519 } from "@/crypt";
import { ref, watch, readonly, type Ref, type DeepReadonly } from "vue";

export type KeyState = {
  keyType: KeyAgreementKeyType;
  key: Ref<CryptoKey | null>;
  jwk: DeepReadonly<Ref<JsonWebKey | null>>;
  thumbprint: Readonly<Ref<string>>;
};

export function useKeyState(keyType: KeyAgreementKeyType): KeyState {
  const key = ref<CryptoKey | null>(null);
  const jwk = watchJwk(key);
  const thumbprint = watchThumbprint(key);
  return { keyType, key, jwk, thumbprint };
}

function watchJwk(key: Ref<CryptoKey | null>) {
  const jwk = ref<JsonWebKey | null>(null);
  watch(key, async () => {
    jwk.value = key.value ? await X25519.exportAsJwk(key.value) : null;
  });
  return readonly(jwk);
}

function watchThumbprint(key: Ref<CryptoKey | null>) {
  const thumbprint = ref("");
  watch(key, async () => {
    thumbprint.value = key.value ? await X25519.getThumbprint(key.value) : "";
  });
  return readonly(thumbprint);
}
