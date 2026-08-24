export * from "./errors";
import { aesgcm } from "./aes";
export { parseJwk, type X25519JwkValidationResult } from "./validate";
import {
  getThumbprint,
  validateX25519Jwk,
  type X25519JwkValidationResult,
} from "./validate";
import { x25519, type KeyAgreementKeyType } from "./x25519";

export interface AESGCM {
  algorithm: { name: string; length: number };
  usage: ReadonlyArray<KeyUsage>;
  deriveKey(
    recipientPublicKey: CryptoKey,
    ephemeralKey: CryptoKey,
    salt: Uint8Array<ArrayBuffer>,
  ): Promise<CryptoKey>;
  encrypt(
    content: Uint8Array,
    key: CryptoKey,
    iv: Uint8Array<ArrayBuffer>,
  ): Promise<ArrayBuffer>;
  decrypt(
    ciphertext: ArrayBuffer,
    key: CryptoKey,
    iv: Uint8Array<ArrayBuffer>,
  ): Promise<ArrayBuffer>;
}

export interface X25519 {
  algorithm: { name: string };
  generate(): Promise<CryptoKeyPair>;
  deriveSecret(
    publicKey: CryptoKey,
    privateKey: CryptoKey,
  ): Promise<ArrayBuffer>;
  exportAsJwk(key: CryptoKey): Promise<JsonWebKey>;
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
