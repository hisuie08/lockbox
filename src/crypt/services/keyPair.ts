import type { LockBoxJwk } from "./types";

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
    super(`JWK must be a valid X25519 ${keytype} key.`, cause);
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

export async function genKeyPair(): Promise<CryptoKeyPair> {
  try {
    return await crypto.subtle.generateKey("X25519", true, ["deriveBits"]);
  } catch (err) {
    throw new KeyGenerationError(err);
  }
}

export async function exportAsJwk(
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
      { name: "X25519" },
      true,
      [],
    );
  } catch (err) {
    throw new KeyImportError("public", err);
  }
}
export async function importPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
  try {
    return await crypto.subtle.importKey("jwk", jwk, { name: "X25519" }, true, [
      "deriveBits",
    ]);
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

export function toPublicJwk(privateJwk: LockBoxJwk) {
  const { d, ...publicJwk } = privateJwk; // eslint-disable-line
  return publicJwk;
}
