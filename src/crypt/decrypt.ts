import { base64UrlToArrayBuffer } from "./encoding";
import { FILE_SIGNATURE, FORMAT_VERSION } from "./constants";
import type { ChunkHeader, EncryptedFileHeader } from "./types";
import {
  InputReadError,
  OutputWriteError,
  UnexpectedCryptoError,
} from "./errors";
import { deriveContentEncryptionKey } from "./key/kdf";
import { getJwkThumbprint } from "./key/validate";

export abstract class DecryptionError extends Error {
  override cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = new.target.name;
    this.cause = cause;
  }
}

export class InvalidPrivateKeyError extends DecryptionError {
  constructor(cause?: unknown) {
    super("The private key does not match this file.", cause);
  }
}

export class CorruptedFileError extends DecryptionError {
  constructor(cause?: unknown) {
    super("The encrypted file is corrupted or has been modified.", cause);
  }
}

export class InvalidFileSignatureError extends DecryptionError {
  constructor() {
    super("The file is not a supported encrypted file.");
  }
}

export class UnsupportedVersionError extends DecryptionError {
  constructor(version: number) {
    super(`Unsupported file format version: ${version}`);
  }
}

export class UnexpectedEofError extends DecryptionError {
  constructor() {
    super("Unexpected end of file.");
  }
}

export class InvalidHeaderError extends DecryptionError {
  constructor(cause?: unknown) {
    super("The file header is invalid.", cause);
  }
}

async function decryptChunk(input: {
  iv: Uint8Array;
  ciphercontent: Uint8Array;
  aesKey: CryptoKey;
}): Promise<Uint8Array> {
  try {
    const content = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: input.iv as BufferSource,
      },
      input.aesKey,
      input.ciphercontent as BufferSource,
    );

    return new Uint8Array(content);
  } catch (error) {
    if (error instanceof DOMException && error.name === "OperationError") {
      throw new CorruptedFileError(error);
    }

    throw new UnexpectedCryptoError(error);
  }
}

const decoder = new TextDecoder();

export class BufferedReader {
  private readonly reader: ReadableStreamDefaultReader<Uint8Array>;

  private buffer = new Uint8Array(0);

  constructor(reader: ReadableStreamDefaultReader<Uint8Array>) {
    this.reader = reader;
  }
  async readBytes(length: number): Promise<Uint8Array> {
    while (this.buffer.length < length) {
      let result;

      try {
        result = await this.reader.read();
      } catch (error) {
        throw new InputReadError("Failed to read encrypted file.", error);
      }

      const { done, value } = result;

      if (done) {
        throw new UnexpectedEofError();
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
      let result;

      try {
        result = await this.reader.read();
      } catch (error) {
        throw new InputReadError("Failed to read input file.", error);
      }

      const { done, value } = result;

      if (done) {
        if (this.buffer.length === 0) {
          return null;
        }

        throw new UnexpectedEofError();
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
    throw new InvalidFileSignatureError();
  }

  const version = (await reader.readBytes(1))[0];

  if (version !== FORMAT_VERSION) {
    throw new UnsupportedVersionError(version);
  }

  const headerLengthBytes = await reader.readBytes(4);

  const headerLength = new DataView(headerLengthBytes.buffer).getUint32(0);

  const headerBytes = await reader.readBytes(headerLength);

  try {
    return JSON.parse(decoder.decode(headerBytes)) as EncryptedFileHeader;
  } catch (error) {
    throw new InvalidHeaderError(error);
  }
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
  try {
    const streamReader = input.source.getReader();
    const reader = new BufferedReader(streamReader);
    return await readHeader(reader);
  } catch (error) {
    if (error instanceof DecryptionError) {
      throw error;
    }

    throw new UnexpectedCryptoError(error);
  }
}

export async function decryptFileToStream(input: {
  source: ReadableStream<Uint8Array>;
  privateKey: CryptoKey;
  writer: WritableStreamDefaultWriter<Uint8Array>;
  onProgress: (progress: number) => void;
  onSaved: (saved: boolean) => void;
}): Promise<EncryptedFileHeader> {
  try {
    const streamReader = input.source.getReader();
    const reader = new BufferedReader(streamReader);

    const header = await readHeader(reader);

    let writtenBytes = 0;
    const ephemeralPubKey = await crypto.subtle.importKey(
      "raw",
      base64UrlToArrayBuffer(header.ephemeralPublicKey),
      { name: "X25519" },
      true,
      [],
    );
    const myThumbprint = await getJwkThumbprint(
      await crypto.subtle.exportKey("jwk", input.privateKey),
    );
    if (myThumbprint !== header.recipientThumbprint) {
      throw new InvalidPrivateKeyError();
    }
    const aesKey = await deriveContentEncryptionKey(
      ephemeralPubKey,
      input.privateKey,
      new Uint8Array(base64UrlToArrayBuffer(header.hkdfSalt)),
    );

    while (true) {
      const chunkHeader = await readChunkHeader(reader);

      if (!chunkHeader) {
        break;
      }

      const iv = await reader.readBytes(chunkHeader.ivLength);

      const ciphertext = await reader.readBytes(chunkHeader.length);

      const plaintext = await decryptChunk({
        iv,
        ciphercontent: ciphertext,
        aesKey,
      });

      try {
        await input.writer.write(plaintext);
      } catch (error) {
        throw new OutputWriteError("Failed to write decrypted output.", error);
      }

      writtenBytes += plaintext.length;

      input.onProgress(writtenBytes / header.originalSize);
    }
    input.onProgress(1);
    try {
      await input.writer.close();
      input.onSaved(true);
    } catch (error) {
      throw new OutputWriteError("Failed to write decrypted output.", error);
    }

    return header;
  } catch (error) {
    if (error instanceof DecryptionError) {
      throw error;
    }

    throw new UnexpectedCryptoError(error);
  }
}
