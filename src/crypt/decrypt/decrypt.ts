import { base64UrlToArrayBuffer } from "../utils/encoding";
import type { ChunkHeader, EncryptedFileHeader } from "../types";
import {
  CorruptedFileError,
  DecryptionError,
  InvalidFileSignatureError,
  InvalidHeaderError,
  InvalidPrivateKeyError,
  UnsupportedVersionError,
} from "./errors";
import { StreamBufferedReader, type BufferedReader } from "./bufferedReader";
import {
  InputReadError,
  MemoryError,
  OutputWriteError,
  UnexpectedCryptoError,
} from "../errors";
import {
  CHUNK_HEADER_LAYOUT,
  CHUNK_HEADER_LENGTHS,
  FILE_SIGNATURE,
  FORMAT_VERSION,
  PREAMBLE_LENGTHS,
} from "../constants";
import { X25519, AESGCM } from "../key";
const decoder = new TextDecoder();

async function readFileHeader(
  reader: BufferedReader,
): Promise<EncryptedFileHeader> {
  const signature = decoder.decode(
    await reader.readBytes(PREAMBLE_LENGTHS.FILE_SIGNATURE),
  );

  if (signature !== FILE_SIGNATURE) {
    throw new InvalidFileSignatureError();
  }

  const version = (await reader.readBytes(PREAMBLE_LENGTHS.FORMAT_VERSION))[0];

  if (version !== FORMAT_VERSION) {
    throw new UnsupportedVersionError(version);
  }

  const headerLengthBytes = await reader.readBytes(
    PREAMBLE_LENGTHS.HEADER_LENGTH,
  );

  const headerLength = new DataView(headerLengthBytes.buffer).getUint32(0);

  const headerBytes = await reader.readBytes(headerLength);

  try {
    return JSON.parse(decoder.decode(headerBytes)) as EncryptedFileHeader;
  } catch (error) {
    throw new InvalidHeaderError(error);
  }
}

async function prepareAESKey(
  header: EncryptedFileHeader,
  privateKey: CryptoKey,
) {
  const myThumbprint = await X25519.getThumbprint(privateKey);
  if (myThumbprint !== header.recipientThumbprint) {
    throw new InvalidPrivateKeyError();
  }
  const ephemeralPubKey = await X25519.importRaw(
    base64UrlToArrayBuffer(header.ephemeralPublicKey),
  );
  const aesKey = await AESGCM.deriveKey(
    ephemeralPubKey,
    privateKey,
    new Uint8Array(base64UrlToArrayBuffer(header.hkdfSalt)),
  );
  return aesKey;
}

async function readChunkHeader(
  reader: BufferedReader,
): Promise<ChunkHeader | null> {
  const bytes = await reader.tryReadBytes(
    CHUNK_HEADER_LENGTHS.CIPHERTEXT_LENGTH + CHUNK_HEADER_LENGTHS.IV_LENGTH,
  );
  if (!bytes) {
    return null;
  }
  const view = new DataView(bytes.buffer);
  return {
    length: view.getUint32(CHUNK_HEADER_LAYOUT.LENGTH_OFFSET),
    ivLength: view.getUint32(CHUNK_HEADER_LAYOUT.IV_OFFSET),
  };
}

async function decryptChunk(input: {
  iv: Uint8Array;
  ciphertext: Uint8Array;
  aesKey: CryptoKey;
}): Promise<Uint8Array> {
  try {
    const content = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: input.iv as BufferSource,
      },
      input.aesKey,
      input.ciphertext as BufferSource,
    );

    return new Uint8Array(content);
  } catch (error) {
    if (error instanceof DOMException && error.name === "OperationError") {
      throw new CorruptedFileError(error);
    }

    throw new UnexpectedCryptoError(error);
  }
}

type Chunk = {
  header: ChunkHeader;
  iv: Uint8Array;
  ciphertext: Uint8Array;
};
async function readChunk(reader: BufferedReader): Promise<Chunk | null> {
  const chunkHeader = await readChunkHeader(reader);
  if (chunkHeader == null) {
    return null;
  }
  const iv = await reader.readBytes(chunkHeader.ivLength);
  const ciphertext = await reader.readBytes(chunkHeader.length);
  return { header: chunkHeader, iv, ciphertext };
}

export async function getEncryptedFileHeader(
  input: {
    source: ReadableStream<Uint8Array>;
  },
  signal?: AbortSignal,
): Promise<EncryptedFileHeader> {
  try {
    signal?.throwIfAborted();
    const reader: BufferedReader = new StreamBufferedReader(input.source);
    return await readFileHeader(reader);
  } catch (error) {
    signal?.throwIfAborted();
    if (error instanceof DecryptionError || InputReadError) {
      throw error;
    }

    throw new UnexpectedCryptoError(error);
  }
}

export async function decryptFile(
  input: {
    source: ReadableStream<Uint8Array>;
    privateKey: CryptoKey;
    writer: WritableStreamDefaultWriter<Uint8Array>;
    onProgress: (progress: number) => void;
  },
  signal?: AbortSignal,
): Promise<EncryptedFileHeader> {
  try {
    signal?.throwIfAborted();
    let writtenBytes = 0;
    const reader = new StreamBufferedReader(input.source);
    signal?.throwIfAborted();
    const header = await readFileHeader(reader);
    signal?.throwIfAborted();
    const aesKey = await prepareAESKey(header, input.privateKey);
    while (true) {
      const chunk = await readChunk(reader);
      signal?.throwIfAborted();
      if (!chunk) {
        break;
      }
      const plaintext = await decryptChunk({ ...chunk, aesKey });
      try {
        await input.writer.write(plaintext);
      } catch (error) {
        signal?.throwIfAborted();
        if (error instanceof MemoryError) {
          throw error;
        }
        throw new OutputWriteError("Failed to write decrypted output.", error);
      }
      writtenBytes += plaintext.length;
      input.onProgress(writtenBytes / header.originalSize);
    }

    // 出力ストリーム正常終了
    input.onProgress(1);
    try {
      await input.writer.close();
    } catch (error) {
      signal?.throwIfAborted();
      if (error instanceof MemoryError) {
        throw error;
      }
      throw new OutputWriteError("Failed to write decrypted output.", error);
    }
    return header;
  } catch (error) {
    try {
      // 例外発生時はwriterを中断
      await input.writer.abort(error);
    } catch {} // abortの例外は握りつぶし
    signal?.throwIfAborted();
    if (error instanceof DecryptionError || error instanceof InputReadError) {
      throw error;
    }
    throw new UnexpectedCryptoError(error);
  }
}
