import { KDF_KEY_INFO } from "../constants";

export class KeyDerivationError extends Error {
  override cause?: unknown;
  constructor(cause?: unknown) {
    super("Failed to derive content encryption key.");
    this.cause = cause;
  }
}

// 共有秘密の計算とAES鍵の導出
export async function deriveContentEncryptionKey(
  recipientPublicKey: CryptoKey,
  ephemeralKey: CryptoKey,
  salt: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> {
  try {
    // 共有秘密導出
    const sharedSecret = await crypto.subtle.deriveBits(
      { name: "X25519", public: recipientPublicKey },
      ephemeralKey,
      256,
    );
    // 共有秘密をHKDFに渡せる鍵の形にする
    const sharedSecretKey = await crypto.subtle.importKey(
      "raw",
      sharedSecret,
      "HKDF",
      false,
      ["deriveKey"],
    );
    // HKDFで鍵導出
    return await crypto.subtle.deriveKey(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: salt,
        info: new TextEncoder().encode(KDF_KEY_INFO),
      },
      sharedSecretKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
  } catch (error) {
    throw new KeyDerivationError(error);
  }
}
