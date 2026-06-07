import type { EncryptedFileAlgorithms } from "./types";

export const encryptedFileAlgorithms = {
  keyEncryption: "RSA-OAEP-4096-SHA-256",
  contentEncryption: "AES-GCM-256",
} satisfies EncryptedFileAlgorithms;
export const FILE_SIGNATURE = "ENCFILE1";
export const FORMAT_VERSION = 1;
// デフォルト 4MBチャンク
export const DEFAULT_CHUNK_SIZE = 1024 * 1024 * 4;
