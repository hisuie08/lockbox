import { KeyExportError, KeyGenerationError, KeyImportError } from "./errors";

export const algorithm = { name: "X25519" } as const;
const usage = ["deriveBits"] as const;
export type KeyAgreementKeyType = Exclude<KeyType, "secret">;

export async function generate(): Promise<CryptoKeyPair> {
  try {
    return await crypto.subtle.generateKey(algorithm, true, usage);
  } catch (err) {
    throw new KeyGenerationError(err);
  }
}

export async function deriveSecret(
  publicKey: CryptoKey,
  privateKey: CryptoKey,
): Promise<ArrayBuffer> {
  return await crypto.subtle.deriveBits(
    { ...algorithm, public: publicKey },
    privateKey,
    256,
  );
}

export async function exportAsJwk(key: CryptoKey): Promise<JsonWebKey> {
  try {
    return crypto.subtle.exportKey("jwk", key);
  } catch (err) {
    throw new KeyExportError(err);
  }
}

export async function exportAsRaw(key: CryptoKey): Promise<ArrayBuffer> {
  try {
    return crypto.subtle.exportKey("raw", key);
  } catch (err) {
    throw new KeyExportError(err);
  }
}

export async function importJwk(
  jwk: JsonWebKey,
  keytype: KeyAgreementKeyType,
): Promise<CryptoKey> {
  try {
    return await crypto.subtle.importKey(
      "jwk",
      jwk,
      algorithm,
      true,
      jwk.d ? usage : [],
    );
  } catch (err) {
    throw new KeyImportError(keytype, err);
  }
}

export async function importRaw(raw: ArrayBuffer): Promise<CryptoKey> {
  try {
    return await crypto.subtle.importKey("raw", raw, algorithm, true, []);
  } catch (err) {
    throw new KeyImportError("ephemeral", err);
  }
}

export function toPublicJwk(privateJwk: JsonWebKey): JsonWebKey {
  const { d, ...publicJwk } = privateJwk; // eslint-disable-line
  return publicJwk;
}

export const x25519 = {
  algorithm,
  generate,
  importJwk,
  importRaw,
  deriveSecret,
  exportAsJwk,
  exportAsRaw,
  toPublicJwk,
};
