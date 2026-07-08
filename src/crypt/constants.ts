// FILE_SIGNATURE は必ず8バイト
export const FILE_SIGNATURE = "ENCFILE2";
export const FORMAT_VERSION = 3;
export const KEY_EXCHANGE_ALGORITHM = "X25519";
export const KEY_DERIVATION_ALGORITHM = "HKDF";
export const HASH_ALGORITHM = "SHA256";
export const ENCRYPTION_ALGORITHM = "AES-256-GCM";
export const ALGORITHMS =
  `${KEY_EXCHANGE_ALGORITHM}-` +
  `${KEY_DERIVATION_ALGORITHM}-` +
  `${HASH_ALGORITHM}-` +
  `${ENCRYPTION_ALGORITHM}`;
export const ENCRYPTED_FILE_MIMETYPE = "application/octet-stream";
// デフォルト 4MBチャンク
export const DEFAULT_CHUNK_SIZE = 1024 * 1024 * 4;
export const KDF_KEY_INFO = "file-encryption-v1";
