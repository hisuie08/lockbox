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
  try {
    return await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["encrypt"],
    )
  } catch {
    throw new Error("Public JWK must be a valid RSA-OAEP public key.")
  }
}

export async function importPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
  try {
    return await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["decrypt"],
    )
  } catch {
    throw new Error("Private JWK must be a valid RSA-OAEP private key.")
  }
}

export function parseJwk(value: string): JsonWebKey {
  if (!value.trim()) {
    throw new Error("Paste a JWK before loading it.")
  }

  let parsed: JsonWebKey

  try {
    parsed = JSON.parse(value) as JsonWebKey
  } catch {
    throw new Error("JWK must be valid JSON.")
  }

  if (typeof parsed !== "object" || parsed === null || parsed.kty !== "RSA") {
    throw new Error("JWK must be an RSA key.")
  }

  return parsed
}

export function formatJwk(jwk: JsonWebKey): string {
  return JSON.stringify(jwk, null, 2)
}
