import type { KeyAgreementKeyType } from "../types";
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
  keytype: KeyAgreementKeyType,
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

export async function importRaw(raw: ArrayBuffer): Promise<CryptoKey> {
  try {
    return await crypto.subtle.importKey(
      "raw",
      raw,
      { name: "X25519" },
      true,
      [],
    );
  } catch (err) {
    throw new KeyImportError("ephemeral", err);
  }
}

export function toPublicJwk(privateJwk: JsonWebKey) {
  const { d, ...publicJwk } = privateJwk; // eslint-disable-line
  return publicJwk;
}
