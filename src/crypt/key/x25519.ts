import { KeyExportError, KeyGenerationError, KeyImportError } from "./errors";
import { arrayBufferToBase64Url, isBase64Url } from "../utils/encoding";
import { KeyParseError } from "./errors";

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

export type X25519JwkValidationResult =
  | {
      valid: true;
      keyType: KeyAgreementKeyType;
      jwk: JsonWebKey;
    }
  | {
      valid: false;
      keyType: null;
      errors: string[];
    };

export function parseJwk(value: string): JsonWebKey {
  try {
    return JSON.parse(value) as JsonWebKey;
  } catch (err) {
    throw new KeyParseError("JWK must be valid JSON.", err);
  }
}
export function validateX25519Jwk(input: unknown): X25519JwkValidationResult {
  const errors: string[] = [];

  if (typeof input !== "object" || input === null) {
    return {
      valid: false,
      keyType: null,
      errors: ["JWK must be an object"],
    };
  }

  const jwk = input as JsonWebKey;

  if (jwk.kty !== "OKP") {
    errors.push("kty must be OKP");
  }

  if (jwk.crv !== "X25519") {
    errors.push("crv must be X25519");
  }

  if (!isBase64Url(jwk.x)) {
    errors.push("x is missing or invalid");
  }

  const hasPrivateMaterial = jwk.d !== undefined;
  const isPrivateKey = isBase64Url(jwk.d);
  const isPublicKey = !hasPrivateMaterial;

  if (errors.length > 0) {
    return {
      valid: false,
      keyType: null,
      errors,
    };
  }

  if (isPrivateKey) {
    return {
      valid: true,
      keyType: "private",
      jwk,
    };
  }

  if (isPublicKey) {
    return {
      valid: true,
      keyType: "public",
      jwk,
    };
  }

  return {
    valid: false,
    keyType: null,
    errors: ["Invalid X25519 JWK"],
  };
}

export function canonicalizeX25519Jwk(jwk: JsonWebKey): string {
  if (jwk.kty !== "OKP" || jwk.crv !== "X25519" || typeof jwk.x !== "string") {
    throw new KeyParseError("Invalid X25519 JWK");
  }

  return JSON.stringify({
    crv: jwk.crv,
    kty: jwk.kty,
    x: jwk.x,
  });
}

export async function getThumbprint(
  jwk: JsonWebKey | CryptoKey | null,
): Promise<string> {
  if (!jwk) {
    return "";
  }
  if (jwk instanceof CryptoKey) {
    jwk = await crypto.subtle.exportKey("jwk", jwk);
  }
  const canonicalJwk = canonicalizeX25519Jwk(jwk);

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonicalJwk),
  );
  return arrayBufferToBase64Url(digest);
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
