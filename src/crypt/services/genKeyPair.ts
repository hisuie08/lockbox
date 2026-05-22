const rsaOaepParams = {
  name: "RSA-OAEP",
  modulusLength: 4096,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256",
} satisfies RsaHashedKeyGenParams

export async function genKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(rsaOaepParams, true, ["encrypt", "decrypt"])
}

export async function exportPublicKey(key: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey("jwk", key)
}

export async function exportPrivateKey(key: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey("jwk", key)
}

export async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"],
  )
}

export async function importPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"],
  )
}

export function parseJwk(value: string): JsonWebKey {
  const parsed = JSON.parse(value) as JsonWebKey

  if (typeof parsed !== "object" || parsed === null || typeof parsed.kty !== "string") {
    throw new Error("Key must be a JSON Web Key.")
  }

  return parsed
}

export function formatJwk(jwk: JsonWebKey): string {
  return JSON.stringify(jwk, null, 2)
}
