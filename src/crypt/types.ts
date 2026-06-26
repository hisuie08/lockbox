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
export interface ChunkHeader {
  length: number;
  ivLength: number;
}
