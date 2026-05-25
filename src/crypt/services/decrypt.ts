import { base64ToBytes } from "./encoding"
import { createAdditionalData, parseEncryptedFilePayload } from "./payload"
import type { DecryptFileResult, EncryptedFileMetadata } from "./types"

export async function decryptFile(input: {
  file: File
  privateKey: CryptoKey
}): Promise<DecryptFileResult> {
  const payload = parseEncryptedFilePayload(await input.file.text())
  const metadata: EncryptedFileMetadata = {
    version: payload.version,
    algorithms: payload.algorithms,
    originalName: payload.originalName,
    originalType: payload.originalType,
    originalSize: payload.originalSize,
    encryptedKey: payload.encryptedKey,
    iv: payload.iv,
    createdAt: payload.createdAt,
  }
  let rawAesKey: ArrayBuffer

  try {
    rawAesKey = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      input.privateKey,
      base64ToBytes(payload.encryptedKey),
    )
  } catch {
    throw new Error("This private key cannot unlock the encrypted file.")
  }

  const aesKey = await crypto.subtle.importKey(
    "raw",
    rawAesKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  )
  let plaintext: ArrayBuffer

  try {
    plaintext = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: base64ToBytes(payload.iv),
        additionalData: createAdditionalData(metadata),
      },
      aesKey,
      base64ToBytes(payload.ciphertext),
    )
  } catch {
    throw new Error("Encrypted file authentication failed. The file may be corrupted or modified.")
  }

  return {
    blob: new Blob([plaintext], {
      type: payload.originalType || "application/octet-stream",
    }),
    filename: payload.originalName || "decrypted-file",
    metadata,
  }
}
