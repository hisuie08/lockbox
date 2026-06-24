import { bytesToBase64Url, uint32ToBytes } from "./encoding";
import {
  ALGORITHMS,
  DEFAULT_CHUNK_SIZE,
  FILE_SIGNATURE,
  FORMAT_VERSION,
} from "./constants";
import type { EncryptedFileHeader } from "./types";
import {
  InputReadError,
  OutputWriteError,
  UnexpectedCryptoError,
} from "./errors";
import { genKeyPair } from "./keyPair";
import { deriveContentEncryptionKey } from "./kdf";
import { getJwkThumbprint } from "./validate";

export abstract class EncryptionError extends Error {
  override cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = new.target.name;
    this.cause = cause;
  }
}

const encoder = new TextEncoder();
// X25519-HKDF: 鍵交換
//AES-GCM: ファイル本体暗号化鍵

export async function createHeader(input: {
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
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const aesKey = await deriveContentEncryptionKey(
    input.recipientPublicKey,
    ephemeral.privateKey,
    salt,
    "encrypt",
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

export async function encryptChunk(
  content: Uint8Array,
  aesKey: CryptoKey,
): Promise<{
  iv: Uint8Array;
  ciphertext: Uint8Array;
}> {
  const iv = crypto.getRandomValues(new Uint8Array(12));

  try {
    const encrypted = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      aesKey,
      content as BufferSource,
    );

    return {
      iv,
      ciphertext: new Uint8Array(encrypted),
    };
  } catch (error) {
    throw new UnexpectedCryptoError(error);
  }
}

export async function writeHeader(
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

export async function writeChunk(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  chunk: {
    iv: Uint8Array;
    ciphertext: Uint8Array;
  },
): Promise<void> {
  try {
    const header = new Uint8Array(8);
    const view = new DataView(header.buffer);

    view.setUint32(0, chunk.ciphertext.length);
    view.setUint32(4, chunk.iv.length);

    await writer.write(header);
    await writer.write(chunk.iv);
    await writer.write(chunk.ciphertext);
  } catch (error) {
    throw new OutputWriteError("Failed to write encrypted output.", error);
  }
}

export async function encryptFileToStream(input: {
  filename: string;
  filetype: string;
  fileSize: number;
  source: ReadableStream<Uint8Array>;
  publicKey: CryptoKey;
  writer: WritableStreamDefaultWriter<Uint8Array>;
  onProgress: (progress: number) => void;
  onSaved: (saved: boolean) => void;
  createdAt?: string;
}): Promise<void> {
  try {
    const chunkSize = DEFAULT_CHUNK_SIZE;
    let processedBytes = 0;
    const publicJwk = await crypto.subtle.exportKey("jwk", input.publicKey);
    const { aesKey, header } = await createHeader({
      ...input,
      recipientPublicKey: input.publicKey,
      recipientThumbprint: await getJwkThumbprint(publicJwk),
      algorithm: ALGORITHMS,
      chunkSize,
    });

    await writeHeader(input.writer, header);

    const reader = input.source.getReader();

    let pending = new Uint8Array(0);

    while (true) {
      let result;

      try {
        result = await reader.read();
      } catch (error) {
        throw new InputReadError("Failed to read input file.", error);
      }

      const { done, value } = result;

      if (done) {
        break;
      }

      processedBytes += value.length;
      input.onProgress(processedBytes / input.fileSize);

      const merged = new Uint8Array(pending.length + value.length);

      merged.set(pending);
      merged.set(value, pending.length);

      let offset = 0;

      while (merged.length - offset >= chunkSize) {
        const chunk = merged.slice(offset, offset + chunkSize);

        const encrypted = await encryptChunk(chunk, aesKey);

        await writeChunk(input.writer, encrypted);

        offset += chunkSize;
      }

      pending = merged.slice(offset);
    }
    // 空ファイルでも完全性保護のため空チャンクを1つ保存する
    if (pending.length > 0 || processedBytes === 0) {
      const encrypted = await encryptChunk(pending, aesKey);
      await writeChunk(input.writer, encrypted);
    }
    input.onProgress(1);
    try {
      await input.writer.close();
      input.onSaved(true);
    } catch (error) {
      throw new OutputWriteError("Failed to write encrypted output.", error);
    }
  } catch (error) {
    if (error instanceof EncryptionError) {
      throw error;
    }

    throw new UnexpectedCryptoError(error);
  }
}
