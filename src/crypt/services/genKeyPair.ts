import type { LockBoxJwk } from "./types";
import { validateRsaJwk } from "./validate";
export abstract class KeyPairError extends Error {
  override cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = new.target.name;
    this.cause = cause;
  }
}

export class KeyGenerationError extends KeyPairError {
  constructor(cause?: unknown) {
    super("key generation failed", cause);
  }
}

export class KeyImportError extends KeyPairError {
  constructor(keytype: string, cause?: unknown) {
    super(`Public JWK must be a valid RSA-OAEP ${keytype} key.`, cause);
  }
}

export class KeyParseError extends KeyPairError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

export class KeyExportError extends KeyPairError {
  constructor(cause?: unknown) {
    super("Failed to export key.", cause);
  }
}

export class KeyDerivationError extends KeyPairError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

const rsaOaepParams = {
  name: "RSA-OAEP",
  modulusLength: 4096,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256",
} satisfies RsaHashedKeyGenParams;

export async function genKeyPair(): Promise<CryptoKeyPair> {
  try {
    return await crypto.subtle.generateKey(rsaOaepParams, true, [
      "encrypt",
      "decrypt",
    ]);
  } catch (err) {
    throw new KeyGenerationError(err);
  }
}

export async function exportKey(
  key: CryptoKey,
  date: Date,
): Promise<LockBoxJwk> {
  try {
    return {
      ...(await crypto.subtle.exportKey("jwk", key)),
      created_at: date,
    };
  } catch (err) {
    throw new KeyExportError(err);
  }
}

export async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
  try {
    return await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["encrypt"],
    );
  } catch (err) {
    throw new KeyImportError("public", err);
  }
}

export async function importPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
  try {
    return await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["decrypt"],
    );
  } catch (err) {
    throw new KeyImportError("private", err);
  }
}

export function parseJwk(value: string): LockBoxJwk {
  try {
    return JSON.parse(value) as LockBoxJwk;
  } catch (err) {
    throw new KeyParseError("JWK must be valid JSON.", err);
  }
}

export function derivePublicKey(privateJwk: LockBoxJwk) {
  const derived = { ...privateJwk };
  const privateFields = ["d", "p", "q", "dp", "dq", "qi"] as const;
  for (const k of privateFields) {
    delete derived?.[k];
  }
  derived.key_ops = ["encrypt"];
  const check = validateRsaJwk(derived);
  if (check.valid == true && check.keyType == "public") {
    return check.jwk;
  } else {
    throw new KeyDerivationError("public key drivation failed");
  }
}
