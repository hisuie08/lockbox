import { CHUNK_HEADER_LAYOUT, CHUNK_HEADER_LENGTHS } from "../constants";
import { OutputWriteError, UnexpectedCryptoError } from "../errors";
import { genIv } from "../utils/random";

export async function encryptChunk(
  content: Uint8Array,
  aesKey: CryptoKey,
): Promise<{
  iv: Uint8Array;
  ciphertext: Uint8Array;
}> {
  try {
    const iv = genIv();
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

export async function writeChunk(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  chunk: {
    iv: Uint8Array;
    ciphertext: Uint8Array;
  },
): Promise<void> {
  try {
    const header = new Uint8Array(CHUNK_HEADER_LENGTHS.CIPHERTEXT_LENGTH+CHUNK_HEADER_LENGTHS.IV_LENGTH);
    const view = new DataView(header.buffer);

    view.setUint32(CHUNK_HEADER_LAYOUT.LENGTH_OFFSET, chunk.ciphertext.length);
    view.setUint32(CHUNK_HEADER_LAYOUT.IV_OFFSET, chunk.iv.length);

    await writer.write(header);
    await writer.write(chunk.iv);
    await writer.write(chunk.ciphertext);
  } catch (error) {
    throw new OutputWriteError("Failed to write encrypted output.", error);
  }
}
