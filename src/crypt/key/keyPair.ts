import { KeyExportError, KeyGenerationError, KeyImportError } from "./errors";

export async function genKeyPair(): Promise<CryptoKeyPair> {
  try {
    return await crypto.subtle.generateKey("X25519", true, ["deriveBits"]);
  } catch (err) {
    throw new KeyGenerationError(err);
  }
}

export async function exportAsJwk(key: CryptoKey): Promise<JsonWebKey> {
  try {
    return crypto.subtle.exportKey("jwk", key);
  } catch (err) {
    throw new KeyExportError(err);
  }
}
export async function importJwk(
  jwk: JsonWebKey,
  keytype: "public" | "private",
): Promise<CryptoKey> {
  const keyUsages: ReadonlyArray<KeyUsage> =
    keytype == "private" ? ["deriveBits"] : [];
  try {
    return await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "X25519" },
      true,
      keyUsages,
    );
  } catch (err) {
    throw new KeyImportError(keytype, err);
  }
}

export function toPublicJwk(privateJwk: JsonWebKey) {
  const { d, ...publicJwk } = privateJwk; // eslint-disable-line
  return publicJwk;
}
