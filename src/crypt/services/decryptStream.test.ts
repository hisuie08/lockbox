import { describe, expect, test } from "vitest";
import {
  BufferedReader,
  CorruptedFileError,
  InvalidFileSignatureError,
  InvalidPrivateKeyError,
  UnsupportedVersionError,
  getEncryptedFileHeader,
  decryptFileToStream,
  UnexpectedEofError,
} from "./decryptStream";
import { BufferWriter } from "./bufferWriter";
import { genKeyPair } from "./keyPair";
import { encryptFileToStream, writeHeader } from "./encryptStream";
import { FILE_SIGNATURE, FORMAT_VERSION } from "./constants";

function streamFromChunks(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });
}

async function blobToBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

describe("BufferedReader", () => {
  test("reads exact length", async () => {
    const source = streamFromChunks([new Uint8Array([1, 2, 3, 4])]);

    const reader = new BufferedReader(source.getReader());

    const bytes = await reader.readBytes(4);

    expect(Array.from(bytes)).toEqual([1, 2, 3, 4]);
  });

  test("reads across multiple chunks", async () => {
    const source = streamFromChunks([
      new Uint8Array([1, 2]),
      new Uint8Array([3, 4]),
    ]);

    const reader = new BufferedReader(source.getReader());

    const bytes = await reader.readBytes(4);

    expect(Array.from(bytes)).toEqual([1, 2, 3, 4]);
  });

  test("preserves remaining buffer", async () => {
    const source = streamFromChunks([new Uint8Array([1, 2, 3, 4])]);

    const reader = new BufferedReader(source.getReader());

    expect(Array.from(await reader.readBytes(2))).toEqual([1, 2]);

    expect(Array.from(await reader.readBytes(2))).toEqual([3, 4]);
  });

  test("tryReadBytes returns null at eof", async () => {
    const source = streamFromChunks([]);

    const reader = new BufferedReader(source.getReader());

    await expect(reader.tryReadBytes(8)).resolves.toBeNull();
  });

  test("throws on unexpected eof", async () => {
    const source = streamFromChunks([new Uint8Array([1, 2])]);

    const reader = new BufferedReader(source.getReader());

    await expect(reader.readBytes(8)).rejects.toThrow();
  });
});

describe("getEncryptedFileHeader", () => {
  test("reads valid header", async () => {
    const buffer = new BufferWriter();

    const header = {
      algorithm: "X25519-HKDF-SHA-256-AES-GCM-256",
      chunkSize: 65536,
      ephemeralPublicKey: "pub",
      recipientThumbprint: "thumb",
      originalName: "test.txt",
      hkdfSalt: "salt",
      originalType: "text/plain",
      originalSize: 123,
      createdAt: "2025-01-01T00:00:00.000Z",
    };

    const writer = buffer.stream.getWriter();

    await writeHeader(writer, header);
    await writer.close();

    const bytes = await blobToBytes(buffer.toBlob());

    const parsed = await getEncryptedFileHeader({
      source: streamFromChunks([bytes]),
    });

    expect(parsed).toEqual(header);
  });

  test("rejects invalid signature", async () => {
    const badSignature = new TextEncoder().encode(
      "X".repeat(FILE_SIGNATURE.length),
    );
    const source = streamFromChunks([badSignature]);
    await expect(getEncryptedFileHeader({ source })).rejects.toThrow(
      InvalidFileSignatureError,
    );
  });
  test("throws on truncated file", async () => {
    const source = streamFromChunks([new TextEncoder().encode("I")]);

    await expect(getEncryptedFileHeader({ source })).rejects.toThrow(
      UnexpectedEofError,
    );
  });

  test("rejects unsupported version", async () => {
    const encoder = new TextEncoder();

    const source = streamFromChunks([
      encoder.encode(FILE_SIGNATURE),
      Uint8Array.of(FORMAT_VERSION + 1),
      new Uint8Array(4),
    ]);

    await expect(getEncryptedFileHeader({ source })).rejects.toThrow(
      UnsupportedVersionError,
    );
  });
});

describe("decryptFileToStream", () => {
  test("roundtrip encryption and decryption", async () => {
    const recipient = await genKeyPair();

    const plaintext = "Hello LockBox!";

    const encryptedBuffer = new BufferWriter();

    await encryptFileToStream({
      filename: "test.txt",
      filetype: "text/plain",
      fileSize: plaintext.length,
      source: streamFromChunks([new TextEncoder().encode(plaintext)]),
      publicKey: recipient.publicKey,
      writer: encryptedBuffer.stream.getWriter(),
      onProgress() {},
      onSaved: () => {},
    });

    const encryptedBytes = await blobToBytes(encryptedBuffer.toBlob());

    const decryptedBuffer = new BufferWriter();

    const header = await decryptFileToStream({
      source: streamFromChunks([encryptedBytes]),
      privateKey: recipient.privateKey,
      writer: decryptedBuffer.stream.getWriter(),
      onProgress() {},
      onSaved: () => {},
    });

    const decryptedText = await decryptedBuffer.toFile("result.txt").text();

    expect(decryptedText).toBe(plaintext);

    expect(header.originalName).toBe("test.txt");
  });

  test("rejects wrong private key", async () => {
    const recipientA = await genKeyPair();

    const recipientB = await genKeyPair();

    const encryptedBuffer = new BufferWriter();

    await encryptFileToStream({
      filename: "test.txt",
      filetype: "text/plain",
      fileSize: 4,
      source: streamFromChunks([new TextEncoder().encode("test")]),
      publicKey: recipientA.publicKey,
      writer: encryptedBuffer.stream.getWriter(),
      onProgress() {},
      onSaved: () => {},
    });

    const encryptedBytes = await blobToBytes(encryptedBuffer.toBlob());

    await expect(
      decryptFileToStream({
        source: streamFromChunks([encryptedBytes]),
        privateKey: recipientB.privateKey,
        writer: new BufferWriter().stream.getWriter(),
        onProgress() {},
        onSaved: () => {},
      }),
    ).rejects.toThrow(InvalidPrivateKeyError);
  });

  test("detects tampered ciphertext", async () => {
    const recipient = await genKeyPair();

    const encryptedBuffer = new BufferWriter();

    await encryptFileToStream({
      filename: "test.txt",
      filetype: "text/plain",
      fileSize: 4,
      source: streamFromChunks([new TextEncoder().encode("test")]),
      publicKey: recipient.publicKey,
      writer: encryptedBuffer.stream.getWriter(),
      onProgress() {},
      onSaved: () => {},
    });

    const encryptedBytes = await blobToBytes(encryptedBuffer.toBlob());

    encryptedBytes[encryptedBytes.length - 1] ^= 1;

    await expect(
      decryptFileToStream({
        source: streamFromChunks([encryptedBytes]),
        privateKey: recipient.privateKey,
        writer: new BufferWriter().stream.getWriter(),
        onProgress() {},
        onSaved: () => {},
      }),
    ).rejects.toThrow(CorruptedFileError);
  });

  test("decrypts empty file", async () => {
    const recipient = await genKeyPair();

    const encryptedBuffer = new BufferWriter();

    await encryptFileToStream({
      filename: "empty.txt",
      filetype: "text/plain",
      fileSize: 0,
      source: streamFromChunks([]),
      publicKey: recipient.publicKey,
      writer: encryptedBuffer.stream.getWriter(),
      onProgress() {},
      onSaved: () => {},
    });

    const encryptedBytes = await blobToBytes(encryptedBuffer.toBlob());

    const decryptedBuffer = new BufferWriter();

    await decryptFileToStream({
      source: streamFromChunks([encryptedBytes]),
      privateKey: recipient.privateKey,
      writer: decryptedBuffer.stream.getWriter(),
      onProgress() {},
      onSaved: () => {},
    });

    expect(decryptedBuffer.size).toBe(0);
  });
});
