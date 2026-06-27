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

// 8バイト整数
// 最初の4バイト: コンテンツ本文の長さ
// 後半の4バイト: Ivの長さ
export interface ChunkHeader {
  length: number;
  ivLength: number;
}
