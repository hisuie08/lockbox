export type EncryptedFileAlgorithms = {
  keyEncryption: string;
  contentEncryption: string;
};

export type LockBoxJwk = JsonWebKey & {
  created_at: Date;
};

export type EncryptedFileHeader = {
  algorithm: string;
  rsaAlgorithm: string;
  chunkSize: number;

  encryptedKey: string;

  originalName: string;
  originalType: string;
  originalSize: number;

  createdAt: string;
};
export interface ChunkHeader {
  length: number;
  ivLength: number;
}
