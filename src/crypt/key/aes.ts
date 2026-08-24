import { KDF_KEY_INFO } from "../constants";
import { x25519 } from "./x25519";

const AES = {
  algorithm: { name: "AES-GCM", length: 256 },
  usage: ["encrypt", "decrypt"],
} as const;

const HKDF = {
  algorithm: { name: "HKDF", hash: "SHA-256" },
  usage: ["deriveKey"],
} as const;

export class KeyDerivationError extends Error {
  override cause?: unknown;
  constructor(cause?: unknown) {
    super("Failed to derive content encryption key.");
    this.cause = cause;
  }
}

// 共有秘密の計算とAES鍵の導出
export async function deriveKey(
  recipientPublicKey: CryptoKey,
  ephemeralKey: CryptoKey,
  salt: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> {
  try {
    // 共有秘密導出
    const sharedSecret = await x25519.deriveSecret(
      recipientPublicKey,
      ephemeralKey,
    );
    // 共有秘密をHKDFに渡せる鍵の形にする
    const sharedSecretKey = await crypto.subtle.importKey(
      "raw",
      sharedSecret,
      HKDF.algorithm,
      false,
      HKDF.usage,
    );
    // HKDFで鍵導出
    return await crypto.subtle.deriveKey(
      {
        ...HKDF.algorithm,
        salt: salt,
        info: new TextEncoder().encode(KDF_KEY_INFO),
      },
      sharedSecretKey,
      AES.algorithm,
      false,
      AES.usage,
    );
  } catch (error) {
    throw new KeyDerivationError(error);
  }
}

export async function encrypt(
  content: Uint8Array,
  key: CryptoKey,
  iv: Uint8Array<ArrayBuffer>,
): Promise<ArrayBuffer> {
  return await crypto.subtle.encrypt(
    { ...AES.algorithm, iv:iv },
    key,
    content as BufferSource,
  );
}

export async function decrypt(
  ciphertext: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array<ArrayBuffer>,
): Promise<ArrayBuffer> {
  return await crypto.subtle.decrypt(
    { ...AES.algorithm, iv: iv },
    key,
    ciphertext,
  );
}

export const aesgcm = {
  ...AES,
  deriveKey,
  encrypt,
  decrypt,
};
