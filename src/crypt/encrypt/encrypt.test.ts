import { describe, expect, test } from "vitest";
import { generate } from "../key/x25519";
import { encryptFile } from "./encrypt";
import {
  ALGORITHMS,
  CHUNK_HEADER_LAYOUT,
  DEFAULT_CHUNK_SIZE,
  ENCRYPTED_FILE_MIMETYPE,
  FILE_SIGNATURE,
  FORMAT_VERSION,
  PREAMBLE_LAYOUT,
} from "../constants";
import { BufferedWriter } from "../test/bufferWriter";
import type { EncryptedFileHeader } from "../types";
import {
  createEncryptedFileHeader,
  writeFileHeader,
  encryptChunk,
  writeChunk,
} from "./encrypt";

async function blobToBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

describe("encryptStream", () => {
  const file = new File([] as BlobPart[], "test.txt");
  test("creates valid header", async () => {
    const recipient = await generate();

    const result = await createEncryptedFileHeader({
      filename: file.name,
      filetype: file.type,
      fileSize: file.size,
      recipientPublicKey: recipient.publicKey,
      algorithm: ALGORITHMS,
    });

    expect(result.header.algorithm).toBe(ALGORITHMS);
    expect(result.header.originalName).toBe(file.name);
    expect(result.header.ephemeralPublicKey).toBeTruthy();
    expect(result.header.hkdfSalt).toBeTruthy();
    expect(result.aesKey.algorithm.name).toBe("AES-GCM");
  });
  test("encrypts chunk", async () => {
    const aesKey = await crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      false,
      ["encrypt"],
    );

    const plaintext = new Uint8Array([1, 2, 3]);
    const encrypted = await encryptChunk(plaintext, aesKey);
    expect(encrypted.iv.length).toBe(12);
    expect(encrypted.ciphertext.length).toBeGreaterThan(0);
  });
  describe("writeHeader", () => {
    test("writes header format", async () => {
      const buffer = new BufferedWriter();
      const writer = buffer.stream.getWriter();

      const header: EncryptedFileHeader = {
        algorithm: ALGORITHMS,
        chunkSize: DEFAULT_CHUNK_SIZE,
        ephemeralPublicKey: "ephemeral",
        recipientThumbprint: "thumbprint",
        originalName: "test.txt",
        hkdfSalt: "salt",
        originalType: "text/plain",
        originalSize: 123,
        createdAt: "2025-01-01T00:00:00.000Z",
      };

      await writeFileHeader(writer, header);
      await writer.close();

      const bytes = await blobToBytes(buffer.toBlob(ENCRYPTED_FILE_MIMETYPE));

      const signatureBytes = new TextEncoder().encode(FILE_SIGNATURE);

      expect(Array.from(bytes.slice(0, signatureBytes.length))).toEqual(
        Array.from(signatureBytes),
      );

      expect(bytes[signatureBytes.length]).toBe(FORMAT_VERSION);

      const view = new DataView(bytes.buffer, PREAMBLE_LAYOUT.HEADER_OFFSET);

      const headerLength = view.getUint32(0);

      const headerJson = new TextDecoder().decode(
        bytes.slice(
          PREAMBLE_LAYOUT.HEADER_OFFSET,
          PREAMBLE_LAYOUT.HEADER_OFFSET + headerLength,
        ),
      );

      expect(JSON.parse(headerJson)).toEqual(header);
    });
  });
});

describe("writeChunk", () => {
  test("writes chunk format", async () => {
    const buffer = new BufferedWriter();
    const writer = buffer.stream.getWriter();

    const ciphertext = new Uint8Array([4, 5, 6, 7]);
    const iv = new Uint8Array([1, 2, 3]);

    await writeChunk(writer, {
      header: new Uint8Array([0, 0, 0, 4, 0, 0, 0, 3]),
      iv,
      ciphertext,
    });

    await writer.close();

    const bytes = await blobToBytes(buffer.toBlob(ENCRYPTED_FILE_MIMETYPE));

    const view = new DataView(bytes.buffer);

    expect(view.getUint32(CHUNK_HEADER_LAYOUT.LENGTH_OFFSET)).toBe(
      ciphertext.length,
    );
    expect(view.getUint32(CHUNK_HEADER_LAYOUT.IV_OFFSET)).toBe(iv.length);

    expect(Array.from(bytes.slice(8, 11))).toEqual([1, 2, 3]);

    expect(Array.from(bytes.slice(11))).toEqual([4, 5, 6, 7]);
  });
});

describe("encryptFileToStream", () => {
  test("encrypts file stream", async () => {
    const { publicKey } = await generate();

    const buffer = new BufferedWriter();
    const writer = buffer.stream.getWriter();

    const inputBytes = new TextEncoder().encode("hello world");

    const source = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(inputBytes);
        controller.close();
      },
    });

    let progress = 0;

    await encryptFile({
      filename: "hello.txt",
      filetype: "text/plain",
      fileSize: inputBytes.length,
      source,
      publicKey,
      writer,
      onProgress(value) {
        progress = value;
      },
    });

    expect(progress).toBe(1);
    expect(buffer.size).toBeGreaterThan(0);

    const bytes = await blobToBytes(buffer.toBlob(ENCRYPTED_FILE_MIMETYPE));

    const signature = new TextEncoder().encode(FILE_SIGNATURE);

    expect(Array.from(bytes.slice(0, signature.length))).toEqual(
      Array.from(signature),
    );
  });
  test("encrypts empty file", async () => {
    const { publicKey } = await generate();

    const buffer = new BufferedWriter();

    const source = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.close();
      },
    });

    let progress = 0;

    await encryptFile({
      filename: "empty.txt",
      filetype: "text/plain",
      fileSize: 0,
      source,
      publicKey,
      writer: buffer.stream.getWriter(),
      onProgress(value) {
        progress = value;
      },
    });

    expect(progress).toBe(1);
    expect(buffer.size).toBeGreaterThan(0);
  });

  test("throws when source read fails", async () => {
    const { publicKey } = await generate();

    const source = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new Error("boom"));
      },
    });

    const buffer = new BufferedWriter();

    await expect(
      encryptFile({
        filename: "test.txt",
        filetype: "text/plain",
        fileSize: 1,
        source,
        publicKey,
        writer: buffer.stream.getWriter(),
        onProgress() {},
      }),
    ).rejects.toThrow();
  });
});
