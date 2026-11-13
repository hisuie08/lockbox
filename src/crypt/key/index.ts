export * from "./errors";
import { aesgcm } from "./aes";
import { type X25519KeyAlgorithm } from "./constants";
export { parseJwk, type X25519JwkValidationResult } from "./x25519";
export { HKDF } from "./constants";
import {
  x25519,
  type KeyAgreementKeyType,
  getThumbprint,
  validateX25519Jwk,
  type X25519JwkValidationResult,
} from "./x25519";

export interface AESGCM {
  algorithm: AesKeyAlgorithm & { readable: string };
  usage: ReadonlyArray<KeyUsage>;
  deriveKey(
    recipientPublicKey: CryptoKey,
    ephemeralKey: CryptoKey,
    salt: Uint8Array<ArrayBuffer>,
  ): Promise<CryptoKey>;
  encrypt(
    content: BufferSource,
    key: CryptoKey,
    iv: BufferSource,
  ): Promise<ArrayBuffer>;
  decrypt(
    ciphertext: BufferSource,
    key: CryptoKey,
    iv: BufferSource,
  ): Promise<ArrayBuffer>;
}

export interface X25519 {
  algorithm: X25519KeyAlgorithm;
  generate(): Promise<CryptoKeyPair>;
  deriveSecret(
    publicKey: CryptoKey,
    privateKey: CryptoKey,
  ): Promise<ArrayBuffer>;
  exportAsJwk(key: CryptoKey): Promise<JsonWebKey>;
  exportAsRaw(key: CryptoKey): Promise<ArrayBuffer>;
  importJwk(jwk: JsonWebKey, keytype: KeyAgreementKeyType): Promise<CryptoKey>;
  importRaw(raw: ArrayBuffer): Promise<CryptoKey>;
  toPublicJwk(privateJwk: JsonWebKey): JsonWebKey;
  validate(input: unknown): X25519JwkValidationResult;
  getThumbprint(jwk: JsonWebKey | CryptoKey | null): Promise<string>;
}
export const X25519: X25519 = {
  ...x25519,
  getThumbprint,
  validate: validateX25519Jwk,
};

export const AESGCM: AESGCM = aesgcm;
