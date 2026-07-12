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
import { createByteReader, type ByteReader } from "./byteReader";
import {
  InputReadError,
  OutputWriteError,
  UnexpectedCryptoError,
} from "../errors";
import { deriveContentEncryptionKey } from "../key/kdf";
import {
  CHUNK_HEADER_LAYOUT,
  CHUNK_HEADER_LENGTHS,
  FILE_SIGNATURE,
  FORMAT_VERSION,
  PREAMBLE_LENGTHS,
} from "../constants";
import { _SHA224 } from "@noble/hashes/sha2.js";
import { getJwkThumbprint } from "../key/validate";
const decoder = new TextDecoder();

export async function readFileHeader(
  reader: ByteReader,
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
  const myThumbprint = await getJwkThumbprint(privateKey);
  if (myThumbprint !== header.recipientThumbprint) {
    throw new InvalidPrivateKeyError();
  }
  const ephemeralPubKey = await crypto.subtle.importKey(
    "raw",
    base64UrlToArrayBuffer(header.ephemeralPublicKey),
    { name: "X25519" },
    true,
    [],
  );
  const aesKey = await deriveContentEncryptionKey(
    ephemeralPubKey,
    privateKey,
    new Uint8Array(base64UrlToArrayBuffer(header.hkdfSalt)),
  );
  return aesKey;
}

async function readChunkHeader(
  reader: ByteReader,
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
async function readChunk(reader: ByteReader): Promise<Chunk | null> {
  const chunkHeader = await readChunkHeader(reader);
  if (chunkHeader == null) {
    return null;
  }
  const iv = await reader.readBytes(chunkHeader.ivLength);
  const ciphertext = await reader.readBytes(chunkHeader.length);
  return { header: chunkHeader, iv, ciphertext };
}

export async function getEncryptedFileHeader(input: {
  source: Uint8Array | ReadableStream<Uint8Array>;
}): Promise<EncryptedFileHeader> {
  try {
    const reader = createByteReader(input.source);
    return await readFileHeader(reader);
  } catch (error) {
    if (error instanceof DecryptionError || InputReadError) {
      throw error;
    }

    throw new UnexpectedCryptoError(error);
  }
}

export async function decryptFile(input: {
  source: Uint8Array | ReadableStream<Uint8Array>;
  privateKey: CryptoKey;
  writer: WritableStreamDefaultWriter<Uint8Array>;
  onProgress: (progress: number) => void;
  onSaved: (saved: boolean) => void;
}): Promise<EncryptedFileHeader> {
  try {
    let writtenBytes = 0;
    const reader = createByteReader(input.source);
    const header = await readFileHeader(reader);
    const aesKey = await prepareAESKey(header, input.privateKey);
    while (true) {
      const chunk = await readChunk(reader);
      if (!chunk) {
        break;
      }
      const plaintext = await decryptChunk({ ...chunk, aesKey });
      try {
        await input.writer.write(plaintext);
      } catch (error) {
        throw new OutputWriteError("Failed to write decrypted output.", error);
      }
      writtenBytes += plaintext.length;
      input.onProgress(writtenBytes / header.originalSize);
    }

    // 出力ストリーム正常終了
    input.onProgress(1);
    try {
      await input.writer.close();
      input.onSaved(true);
    } catch (error) {
      throw new OutputWriteError("Failed to write decrypted output.", error);
    }
    return header;
  } catch (error) {
    if (error instanceof DecryptionError || InputReadError) {
      throw error;
    }
    throw new UnexpectedCryptoError(error);
  }
}
