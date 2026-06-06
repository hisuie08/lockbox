import type { LockBoxJwk } from "./types";

export type RsaJwkValidationResult =
  | {
      valid: true;
      keyType: "public" | "private";
      jwk: LockBoxJwk;
    }
  | {
      valid: false;
      keyType: null;
      errors: string[];
    };

const BASE64URL_REGEX = /^[A-Za-z0-9_-]+$/;

function isBase64Url(value: unknown): value is string {
  return (
    typeof value === "string" && value.length > 0 && BASE64URL_REGEX.test(value)
  );
}

export function validateRsaJwk(input: unknown): RsaJwkValidationResult {
  const errors: string[] = [];
  
  if (typeof input != "object") {
    return {
      valid: false,
      keyType: null,
      errors: ["JWK must be an object", `type ${typeof input}`],
    };
  }

  const jwk = input as LockBoxJwk;

  if (jwk.kty !== "RSA") {
    errors.push("kty must be RSA");
  }

  const publicFields = ["n", "e"] as const;

  for (const field of publicFields) {
    if (!isBase64Url(jwk[field])) {
      errors.push(`${field} is missing or invalid`);
    }
  }

  const privateFields = ["d", "p", "q", "dp", "dq", "qi"] as const;

  const hasPrivateMaterial = privateFields.some(
    (field) => jwk[field] !== undefined,
  );

  const isPrivateKey = privateFields.every((field) => isBase64Url(jwk[field]));

  const isPublicKey =
    publicFields.every((field) => isBase64Url(jwk[field])) &&
    !hasPrivateMaterial;

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
    errors: [
      "Invalid RSA JWK. Required RSA public/private parameters are missing.",
    ],
  };
}

export function canonicalizeRsaJwk(jwk: JsonWebKey): string {
  if (
    jwk.kty !== "RSA" ||
    typeof jwk.e !== "string" ||
    typeof jwk.n !== "string"
  ) {
    throw new Error("Invalid RSA JWK");
  }

  return JSON.stringify({
    e: jwk.e,
    kty: jwk.kty,
    n: jwk.n,
  });
}

export async function getJwkThumbPrint(key: CryptoKey): Promise<string> {
  const jwk = await crypto.subtle.exportKey("jwk", key);

  const canonicalJwk = canonicalizeRsaJwk(jwk);

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonicalJwk),
  );

  return toBase64Url(digest);
}

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
