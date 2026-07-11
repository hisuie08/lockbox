import { CHUNK_HEADER_LAYOUT, CHUNK_HEADER_LENGTHS } from "../constants";
import { OutputWriteError, UnexpectedCryptoError } from "../errors";
import type { EncryptedChunk } from "../types";
import { genIv } from "../utils/random";

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
