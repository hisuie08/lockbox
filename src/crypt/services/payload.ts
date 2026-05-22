import { encodeText, stableJson } from "./encoding"
import {
  encryptedFileVersion,
  type EncryptedFileAlgorithms,
  type EncryptedFileMetadata,
  type EncryptedFilePayload,
} from "./types"

export const encryptedFileAlgorithms = {
  keyEncryption: "RSA-OAEP-4096-SHA-256",
  contentEncryption: "AES-GCM-256",
} satisfies EncryptedFileAlgorithms

export function createEncryptedFileMetadata(input: {
  originalName: string
  originalType: string
  originalSize: number
  encryptedKey: string
  iv: string
  createdAt: string
}): EncryptedFileMetadata {
  return {
    version: encryptedFileVersion,
    algorithms: encryptedFileAlgorithms,
    originalName: input.originalName,
    originalType: input.originalType,
    originalSize: input.originalSize,
    encryptedKey: input.encryptedKey,
    iv: input.iv,
    createdAt: input.createdAt,
  }
}

export function createAdditionalData(metadata: EncryptedFileMetadata): Uint8Array<ArrayBuffer> {
  return encodeText(stableJson(metadata))
}

export function serializeEncryptedFilePayload(payload: EncryptedFilePayload): Blob {
  return new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  })
}

export function parseEncryptedFilePayload(value: string): EncryptedFilePayload {
  const parsed = JSON.parse(value) as Partial<EncryptedFilePayload>

  if (
    parsed.version !== encryptedFileVersion ||
    parsed.algorithms?.keyEncryption !== encryptedFileAlgorithms.keyEncryption ||
    parsed.algorithms?.contentEncryption !== encryptedFileAlgorithms.contentEncryption ||
    typeof parsed.originalName !== "string" ||
    typeof parsed.originalType !== "string" ||
    typeof parsed.originalSize !== "number" ||
    typeof parsed.encryptedKey !== "string" ||
    typeof parsed.iv !== "string" ||
    typeof parsed.ciphertext !== "string" ||
    typeof parsed.createdAt !== "string"
  ) {
    throw new Error("Encrypted file format is not supported.")
  }

  return {
    version: parsed.version,
    algorithms: parsed.algorithms,
    originalName: parsed.originalName,
    originalType: parsed.originalType,
    originalSize: parsed.originalSize,
    encryptedKey: parsed.encryptedKey,
    iv: parsed.iv,
    ciphertext: parsed.ciphertext,
    createdAt: parsed.createdAt,
  }
}

export function getEncryptedFilename(originalName: string): string {
  const safeName = originalName.trim() || "file"
  return `${safeName}.encrypted.json`
}
