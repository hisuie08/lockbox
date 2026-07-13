/** 
 * EncryptedFileHeaderの例
{
    "algorithm":"X25519-HKDF-SHA256-AES-256-GCM",
    "chunkSize":4194304,"ephemeralPublicKey":"lC-0Gly3MYuZp3kkV-ASUkIbILLMiLJ41LKIIKhUCWY",
    "recipientThumbprint":"mxnMrq3aT8VXivoKr-ofKDzDfDOYGM0nQ6hRz3AnWVA",
    "originalName":"test.txt",
    "hkdfSalt":"FjjzJUJzL29IVwbnOVWMoigAguCIaIz5i3H4zSTmhIM",
    "originalType":"",
    "originalSize":0,
    "createdAt":"2026-07-08T10:37:10.686Z"
}
*/
export type EncryptedFileHeader = {
  algorithm: string;
  chunkSize: number;
  ephemeralPublicKey: string;
  recipientThumbprint: string;
  hkdfSalt: string;
  originalName: string;
  originalType: string;
  originalSize: number;
  createdAt: string;
};

export type EncodedFileHeader = {
  signature: Uint8Array;
  version: Uint8Array;
  headerLength: Uint8Array;
  headerBytes: Uint8Array;
};

// 8バイト整数
// 最初の4バイト: コンテンツ本文の長さ
// 後半の4バイト: Ivの長さ
export interface ChunkHeader {
  length: number;
  ivLength: number;
}

export type EncryptedChunk = {
  header: Uint8Array;
  iv: Uint8Array;
  ciphertext: Uint8Array;
};

export type KeyAgreementKeyType = Exclude<KeyType, "secret">