export const encryptedFileVersion = 1;

export type EncryptedFileVersion = typeof encryptedFileVersion;

export type EncryptedFileAlgorithms = {
  keyEncryption: "RSA-OAEP-4096-SHA-256";
  contentEncryption: "AES-GCM-256";
};

export type EncryptedFilePayload = {
  version: EncryptedFileVersion;
  algorithms: EncryptedFileAlgorithms;
  originalName: string;
  originalType: string;
  originalSize: number;
  encryptedKey: string;
  iv: string;
  ciphertext: string;
  createdAt: string;
};

export type EncryptedFileMetadata = Omit<EncryptedFilePayload, "ciphertext">;

export type EncryptFileResult = {
  blob: Blob;
  filename: string;
  payload: EncryptedFilePayload;
};

export type DecryptFileResult = {
  blob: Blob;
  filename: string;
  metadata: EncryptedFileMetadata;
};

export type LockBoxJwk = JsonWebKey & {
  created_at: Date;
};
