import { arrayBufferToBase64Url, isBase64Url } from "../utils/encoding";
import { KeyParseError } from "./errors";
export type X25519JwkValidationResult =
  | {
      valid: true;
      keyType: "public" | "private";
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
    throw new Error("Invalid X25519 JWK");
  }

  return JSON.stringify({
    crv: jwk.crv,
    kty: jwk.kty,
    x: jwk.x,
  });
}

export async function getJwkThumbprint(
  jwk: JsonWebKey | null,
): Promise<string> {
  if (!jwk) {
    return "";
  }

  const canonicalJwk = canonicalizeX25519Jwk(jwk);

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonicalJwk),
  );
  return arrayBufferToBase64Url(digest);
}
