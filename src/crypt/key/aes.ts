import { x25519 } from "./x25519";
import { AES, HKDF } from "./constants";
import { KeyDerivationError } from "./errors";

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
        info: new TextEncoder().encode(HKDF.keyInfo),
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
  content: BufferSource,
  key: CryptoKey,
  iv: BufferSource,
): Promise<ArrayBuffer> {
  return await crypto.subtle.encrypt(
    { ...AES.algorithm, iv: iv },
    key,
    content,
  );
}

export async function decrypt(
  ciphertext: BufferSource,
  key: CryptoKey,
  iv: BufferSource,
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
