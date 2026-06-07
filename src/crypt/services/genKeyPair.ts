import type { LockBoxJwk } from "./types";
import { validateRsaJwk } from "./validate";

const rsaOaepParams = {
  name: "RSA-OAEP",
  modulusLength: 4096,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256",
} satisfies RsaHashedKeyGenParams;

export async function genKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(rsaOaepParams, true, ["encrypt", "decrypt"]);
}

export async function exportKey(
  key: CryptoKey,
  date: Date,
): Promise<LockBoxJwk> {
  return { ...(await crypto.subtle.exportKey("jwk", key)), created_at: date };
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
  } catch {
    throw new Error("Public JWK must be a valid RSA-OAEP public key.");
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
  } catch {
    throw new Error("Private JWK must be a valid RSA-OAEP private key.");
  }
}

export function parseJwk(value: string): LockBoxJwk {
  let parsed: LockBoxJwk;

  try {
    parsed = JSON.parse(value) as LockBoxJwk;
  } catch {
    throw new Error("JWK must be valid JSON.");
  }

  if (typeof parsed !== "object" || parsed === null || parsed.kty !== "RSA") {
    throw new Error("JWK must be an RSA key.");
  }

  return parsed;
}

export function derivePublicKey(privateJwk: LockBoxJwk) {
  const derived = { ...privateJwk };
  const privateFields = ["d", "p", "q", "dp", "dq", "qi"] as const;
  for (const k of privateFields) {
    delete derived?.[k];
  }
  derived.key_ops = ["encrypt"];
  const check = validateRsaJwk(derived);
  if (check.valid && check.keyType == "public") {
    return check.jwk;
  }
  throw new Error("failed to get public key");
}
