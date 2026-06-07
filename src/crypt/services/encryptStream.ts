import { arrayBufferToBase64, uint32ToBytes } from "./encoding";
import { DEFAULT_CHUNK_SIZE, FILE_SIGNATURE, FORMAT_VERSION } from "./constants";
import type { EncryptedFileHeader } from "./types";

const encoder = new TextEncoder();
// RSA-OAEP: 鍵暗号化鍵
//AES-GCM: ファイル本体暗号化鍵

async function createHeader(input: {
  filename: string;
  filetype: string;
  fileSize: number;
  publicKey: CryptoKey;
  createdAt?: string;
  chunkSize: number;
}): Promise<{
  header: EncryptedFileHeader;
  aesKey: CryptoKey;
}> {
  const aesKey = await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  );

  const rawAesKey = await crypto.subtle.exportKey("raw", aesKey);

  let encryptedKey: ArrayBuffer;

  try {
    encryptedKey = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      input.publicKey,
      rawAesKey,
    );
  } catch {
    throw new Error("Loaded public key cannot encrypt files.");
  }

  return {
    aesKey,
    header: {
      algorithm: "AES-GCM",
      rsaAlgorithm: "RSA-OAEP",
      chunkSize: input.chunkSize,

      encryptedKey: arrayBufferToBase64(encryptedKey),

      originalName: input.filename,
      originalType: input.filetype,
      originalSize: input.fileSize,

      createdAt: input.createdAt ?? new Date().toISOString(),
    },
  };
}

async function encryptChunk(
  plaintext: Uint8Array,
  aesKey: CryptoKey,
): Promise<{
  iv: Uint8Array;
  ciphertext: Uint8Array;
}> {
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    aesKey,
    plaintext as BufferSource,
  );

  return {
    iv,
    ciphertext: new Uint8Array(encrypted),
  };
}
export async function writeHeader(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  header: EncryptedFileHeader,
): Promise<void> {
  const headerJson = JSON.stringify(header);

  const headerBytes = encoder.encode(headerJson);

  await writer.write(encoder.encode(FILE_SIGNATURE));

  await writer.write(Uint8Array.of(FORMAT_VERSION));

  await writer.write(uint32ToBytes(headerBytes.length));

  await writer.write(headerBytes);
}

export async function writeChunk(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  chunk: {
    iv: Uint8Array;
    ciphertext: Uint8Array;
  },
): Promise<void> {
  const header = new Uint8Array(8);

  const view = new DataView(header.buffer);

  view.setUint32(0, chunk.ciphertext.length);

  view.setUint32(4, chunk.iv.length);

  await writer.write(header);

  await writer.write(chunk.iv);

  await writer.write(chunk.ciphertext);
}

export async function encryptFileToStream(input: {
  filename: string;
  filetype: string;
  fileSize: number;
  source: ReadableStream<Uint8Array>;
  publicKey: CryptoKey;
  writer: WritableStreamDefaultWriter<Uint8Array>;
  onProgress: (progress: number) => void;
  createdAt?: string;
}): Promise<void> {
  const chunkSize = DEFAULT_CHUNK_SIZE;
  let processedBytes = 0;
  const { aesKey, header } = await createHeader({
    ...input,
    chunkSize: chunkSize,
  });

  await writeHeader(input.writer, header);

  const reader = input.source.getReader();

  let pending = new Uint8Array(0);

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }
    processedBytes += value.length;
    input.onProgress?.(processedBytes / input.fileSize);
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

  if (pending.length > 0) {
    const encrypted = await encryptChunk(pending, aesKey);

    await writeChunk(input.writer, encrypted);
  }
  await input.writer.close();
  input.onProgress(1);
}
