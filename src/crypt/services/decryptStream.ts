import { base64ToArrayBuffer } from "./encoding";
import { FILE_SIGNATURE, FORMAT_VERSION } from "./constants";
import type { ChunkHeader, EncryptedFileHeader } from "./types";

async function importAesKey(
  encryptedKey: string,
  privateKey: CryptoKey,
): Promise<CryptoKey> {
  const rawKey = await crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey,
    base64ToArrayBuffer(encryptedKey),
  );

  return crypto.subtle.importKey(
    "raw",
    rawKey,
    {
      name: "AES-GCM",
    },
    false,
    ["decrypt"],
  );
}

async function decryptChunk(input: {
  iv: Uint8Array;
  ciphertext: Uint8Array;
  aesKey: CryptoKey;
}): Promise<Uint8Array> {
  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: input.iv as BufferSource,
    },
    input.aesKey,
    input.ciphertext as BufferSource,
  );

  return new Uint8Array(plaintext);
}

const decoder = new TextDecoder();

class BufferedReader {
  private readonly reader: ReadableStreamDefaultReader<Uint8Array>;

  private buffer = new Uint8Array(0);

  constructor(reader: ReadableStreamDefaultReader<Uint8Array>) {
    this.reader = reader;
  }
  async readBytes(length: number): Promise<Uint8Array> {
    while (this.buffer.length < length) {
      const { done, value } = await this.reader.read();

      if (done) {
        throw new Error("Unexpected EOF");
      }

      const merged = new Uint8Array(this.buffer.length + value.length);

      merged.set(this.buffer);
      merged.set(value, this.buffer.length);

      this.buffer = merged;
    }

    const result = this.buffer.slice(0, length);

    this.buffer = this.buffer.slice(length);

    return result;
  }
  async tryReadBytes(length: number): Promise<Uint8Array | null> {
    while (this.buffer.length < length) {
      const { done, value } = await this.reader.read();

      if (done) {
        if (this.buffer.length === 0) {
          return null;
        }

        throw new Error("Unexpected EOF");
      }

      const merged = new Uint8Array(this.buffer.length + value.length);

      merged.set(this.buffer);
      merged.set(value, this.buffer.length);

      this.buffer = merged;
    }

    const result = this.buffer.slice(0, length);

    this.buffer = this.buffer.slice(length);

    return result;
  }
}

async function readHeader(
  reader: BufferedReader,
): Promise<EncryptedFileHeader> {
  const signature = decoder.decode(
    await reader.readBytes(FILE_SIGNATURE.length),
  );

  if (signature !== FILE_SIGNATURE) {
    throw new Error("Invalid file signature");
  }

  const version = (await reader.readBytes(1))[0];

  if (version !== FORMAT_VERSION) {
    throw new Error(`Unsupported version: ${version}`);
  }

  const headerLengthBytes = await reader.readBytes(4);

  const headerLength = new DataView(headerLengthBytes.buffer).getUint32(0);

  const headerBytes = await reader.readBytes(headerLength);

  return JSON.parse(decoder.decode(headerBytes));
}

async function readChunkHeader(
  reader: BufferedReader,
): Promise<ChunkHeader | null> {
  const bytes = await reader.tryReadBytes(8);

  if (!bytes) {
    return null;
  }

  const view = new DataView(bytes.buffer);

  return {
    length: view.getUint32(0),
    ivLength: view.getUint32(4),
  };
}

export async function getEncryptedFileHeader(input: {
  source: ReadableStream<Uint8Array>;
}): Promise<EncryptedFileHeader> {
  const streamReader = input.source.getReader();
  const reader = new BufferedReader(streamReader);
  return readHeader(reader);
}

export async function decryptFileToStream(input: {
  source: ReadableStream<Uint8Array>;
  privateKey: CryptoKey;
  writer: WritableStreamDefaultWriter<Uint8Array>;
  onProgress: (progress: number) => void;
}): Promise<EncryptedFileHeader> {
  const streamReader = input.source.getReader();
  const reader = new BufferedReader(streamReader);
  const header = await readHeader(reader);

  let writtenBytes = 0;

  const aesKey = await importAesKey(header.encryptedKey, input.privateKey);

  while (true) {
    const chunkHeader = await readChunkHeader(reader);
    if (!chunkHeader) {
      break;
    }
    const iv = await reader.readBytes(chunkHeader.ivLength);

    const ciphertext = await reader.readBytes(chunkHeader.length);

    const plaintext = await decryptChunk({
      iv,
      ciphertext,
      aesKey,
    });
    await input.writer.write(plaintext);
    writtenBytes += plaintext.length;
    input.onProgress(writtenBytes / header.originalSize);
  }

  await input.writer.close();
  input.onProgress(1);
  return header;
}
