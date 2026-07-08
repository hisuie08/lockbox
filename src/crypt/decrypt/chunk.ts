import type { BufferedReader } from "../bufferio/bufferReader";
import { CHUNK_HEADER_LAYOUT, CHUNK_HEADER_LENGTHS } from "../constants";
import { UnexpectedCryptoError } from "../errors";
import type { ChunkHeader } from "../types";
import { CorruptedFileError } from "./errors";

export async function decryptChunk(input: {
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

export async function readChunkHeader(
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
