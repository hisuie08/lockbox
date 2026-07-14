import {
  ALGORITHMS,
  CHUNK_HEADER_LAYOUT,
  CHUNK_HEADER_LENGTHS,
  DEFAULT_CHUNK_SIZE,
  FILE_SIGNATURE,
  FORMAT_VERSION,
} from "../constants";
import { FileCryptoError, OutputWriteError, UnexpectedCryptoError } from "../errors";
import type {
  EncodedFileHeader,
  EncryptedChunk,
  EncryptedFileHeader,
} from "../types";
import { genIv, genSalt } from "../utils/random";
import { bytesToBase64Url, uint32ToBytes } from "../utils/encoding";
import { deriveContentEncryptionKey } from "../key/kdf";
import { genKeyPair } from "../key/keyPair";
import { getJwkThumbprint } from "../key/validate";
import { createChunkReader } from "./chunkReader";

export abstract class EncryptionError extends FileCryptoError {
  override cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = new.target.name;
    this.cause = cause;
  }
}

// X25519-HKDF: 鍵交換
//AES-GCM: ファイル本体暗号化鍵

export async function createEncryptedFileHeader(
  input: {
    filename: string;
    filetype: string;
    fileSize: number;
    algorithm: string;
    recipientPublicKey: CryptoKey;
  },
  chunkSize = DEFAULT_CHUNK_SIZE,
): Promise<{
  header: EncryptedFileHeader;
  aesKey: CryptoKey;
}> {
  const recipientThumbprint = await getJwkThumbprint(
    await crypto.subtle.exportKey("jwk", input.recipientPublicKey),
  );
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
      chunkSize: chunkSize,
      ephemeralPublicKey: bytesToBase64Url(ephemeralPubRaw),
      recipientThumbprint: recipientThumbprint,
      originalName: input.filename,
      hkdfSalt: bytesToBase64Url(salt),
      originalType: input.filetype,
      originalSize: input.fileSize,
      createdAt: new Date().toISOString(),
    },
  };
}

export async function encryptChunk(
  content: Uint8Array,
  aesKey: CryptoKey,
): Promise<EncryptedChunk> {
  try {
    const header = new Uint8Array(
      CHUNK_HEADER_LENGTHS.CIPHERTEXT_LENGTH + CHUNK_HEADER_LENGTHS.IV_LENGTH,
    );
    const view = new DataView(header.buffer);
    const iv = genIv();
    const encrypted = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      aesKey,
      content as BufferSource,
    );
    const ciphertext = new Uint8Array(encrypted);

    view.setUint32(CHUNK_HEADER_LAYOUT.LENGTH_OFFSET, ciphertext.length);
    view.setUint32(CHUNK_HEADER_LAYOUT.IV_OFFSET, iv.length);
    return {
      header,
      iv,
      ciphertext,
    };
  } catch (error) {
    throw new UnexpectedCryptoError(error);
  }
}

function encodeHeader(header: EncryptedFileHeader): EncodedFileHeader {
  const encoder = new TextEncoder();

  const headerJson = JSON.stringify(header);
  const headerBytes = encoder.encode(headerJson);
  return {
    signature: encoder.encode(FILE_SIGNATURE),
    version: Uint8Array.of(FORMAT_VERSION),
    headerLength: uint32ToBytes(headerBytes.length),
    headerBytes,
  };
}

export async function writeFileHeader(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  header: EncryptedFileHeader,
): Promise<void> {
  try {
    const encodedHeader = encodeHeader(header);

    await writer.write(encodedHeader.signature);
    await writer.write(encodedHeader.version);
    await writer.write(encodedHeader.headerLength);
    await writer.write(encodedHeader.headerBytes);
  } catch (error) {
    throw new OutputWriteError("Failed to write encrypted output.", error);
  }
}

export async function writeChunk(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  chunk: EncryptedChunk,
): Promise<void> {
  try {
    await writer.write(chunk.header);
    await writer.write(chunk.iv);
    await writer.write(chunk.ciphertext);
  } catch (error) {
    throw new OutputWriteError("Failed to write encrypted output.", error);
  }
}

export async function encryptFile(input: {
  filename: string;
  filetype: string;
  fileSize: number;
  source: Uint8Array | ReadableStream<Uint8Array>;
  publicKey: CryptoKey;
  writer: WritableStreamDefaultWriter<Uint8Array>;
  onProgress: (progress: number) => void;
  onSaved: (saved: boolean) => void;
  createdAt?: string;
}): Promise<void> {
  try {
    let processedBytes = 0;

    // 暗号化ヘッダーを生成して先頭へ書き込む
    const { aesKey, header } = await createEncryptedFileHeader({
      ...input,
      recipientPublicKey: input.publicKey,
      algorithm: ALGORITHMS,
    });

    await writeFileHeader(input.writer, header);
    const reader = createChunkReader(input.source);
    while (true) {
      const chunk = await reader.readChunk();
      if (chunk === null) {
        break;
      }
      processedBytes += chunk.length;
      input.onProgress(processedBytes / input.fileSize);

      const encrypted = await encryptChunk(chunk, aesKey);
      await writeChunk(input.writer, encrypted);
    }

    // 空ファイルでも完全性保護のため空チャンクを1つ保存する。
    if (processedBytes === 0) {
      const encrypted = await encryptChunk(new Uint8Array(), aesKey);
      await writeChunk(input.writer, encrypted);
    }

    // 出力ストリームを正常終了する
    input.onProgress(1);
    try {
      await input.writer.close();
    } catch (error) {
      await input.writer.abort(error);
      throw new OutputWriteError("Failed to write encrypted output.", error);
    }
    input.onSaved(true);
  } catch (error) {
    if (error instanceof EncryptionError) {
      throw error;
    }

    throw new UnexpectedCryptoError(error);
  }
}
