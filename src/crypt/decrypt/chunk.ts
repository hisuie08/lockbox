import type { BufferedReader } from "../bufferio/bufferReader";
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