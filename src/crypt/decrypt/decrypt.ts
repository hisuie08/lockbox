import { base64UrlToArrayBuffer } from "../utils/encoding";
import type { EncryptedFileHeader } from "../types";
import { DecryptionError, InvalidPrivateKeyError } from "./errors";
import { BufferedReader } from "../bufferio/bufferReader";
import {
  InputReadError,
  OutputWriteError,
  UnexpectedCryptoError,
} from "../errors";
import { deriveContentEncryptionKey } from "../key/kdf";
import { getJwkThumbprint } from "../key/validate";
import { readHeader } from "./header";
import { decryptChunk, readChunkHeader } from "./chunk";

export async function getEncryptedFileHeader(input: {
  source: ReadableStream<Uint8Array>;
}): Promise<EncryptedFileHeader> {
  try {
    const streamReader = input.source.getReader();
    const reader = new BufferedReader(streamReader);
    return await readHeader(reader);
  } catch (error) {
    if (error instanceof DecryptionError || InputReadError) {
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
    const myThumbprint = await getJwkThumbprint(input.privateKey);
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
    if (error instanceof DecryptionError || InputReadError) {
      throw error;
    }

    throw new UnexpectedCryptoError(error);
  }
}
