import { FILE_SIGNATURE, FORMAT_VERSION } from "../constants";
import { OutputWriteError } from "../errors";
import { deriveContentEncryptionKey } from "../key/kdf";
import { genKeyPair } from "../key/keyPair";
import type { EncryptedFileHeader } from "../types";
import { bytesToBase64Url, uint32ToBytes } from "../utils/encoding";
import { genSalt } from "../utils/random";

export async function createEncryptedFileHeader(input: {
  filename: string;
  filetype: string;
  fileSize: number;
  algorithm: string;
  recipientPublicKey: CryptoKey;
  recipientThumbprint: string;
  createdAt?: string;
  chunkSize: number;
}): Promise<{
  header: EncryptedFileHeader;
  aesKey: CryptoKey;
}> {
  const ephemeral = await genKeyPair();
  const ephemeralPubRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", ephemeral.publicKey),
  );
  const salt = genSalt();
  const aesKey = await deriveContentEncryptionKey(
    input.recipientPublicKey,
    ephemeral.privateKey,
    salt,
  );

  return {
    aesKey,
    header: {
      algorithm: input.algorithm,
      chunkSize: input.chunkSize,
      ephemeralPublicKey: bytesToBase64Url(ephemeralPubRaw),
      recipientThumbprint: input.recipientThumbprint,
      originalName: input.filename,
      hkdfSalt: bytesToBase64Url(salt),
      originalType: input.filetype,
      originalSize: input.fileSize,
      createdAt: input.createdAt ?? new Date().toISOString(),
    },
  };
}

const encoder = new TextEncoder();

export async function writeFileHeader(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  header: EncryptedFileHeader,
): Promise<void> {
  try {
    const headerJson = JSON.stringify(header);
    const headerBytes = encoder.encode(headerJson);

    await writer.write(encoder.encode(FILE_SIGNATURE));
    await writer.write(Uint8Array.of(FORMAT_VERSION));
    await writer.write(uint32ToBytes(headerBytes.length));
    await writer.write(headerBytes);
  } catch (error) {
    throw new OutputWriteError("Failed to write encrypted output.", error);
  }
}
