import { arrayBufferToBase64, bytesToBase64 } from "./encoding"
import {
  createAdditionalData,
  createEncryptedFileMetadata,
  getEncryptedFilename,
  serializeEncryptedFilePayload,
} from "./payload"
import type { EncryptedFilePayload, EncryptFileResult } from "./types"

export async function encryptFile(input: {
  file: File
  publicKey: CryptoKey
  createdAt?: string
}): Promise<EncryptFileResult> {
  const aesKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  )
  const rawAesKey = await crypto.subtle.exportKey("raw", aesKey)
  let encryptedKey: ArrayBuffer

  try {
    encryptedKey = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      input.publicKey,
      rawAesKey,
    )
  } catch {
    throw new Error("Loaded public key cannot encrypt files.")
  }
  const iv = crypto.getRandomValues(new Uint8Array(12)) as Uint8Array<ArrayBuffer>
  const metadata = createEncryptedFileMetadata({
    originalName: input.file.name,
    originalType: input.file.type,
    originalSize: input.file.size,
    encryptedKey: arrayBufferToBase64(encryptedKey),
    iv: bytesToBase64(iv),
    createdAt: input.createdAt ?? new Date().toISOString(),
  })
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: createAdditionalData(metadata),
    },
    aesKey,
    await input.file.arrayBuffer(),
  )
  const payload: EncryptedFilePayload = {
    ...metadata,
    ciphertext: arrayBufferToBase64(ciphertext),
  }

  return {
    blob: serializeEncryptedFilePayload(payload),
    filename: getEncryptedFilename(input.file.name),
    payload,
  }
}
