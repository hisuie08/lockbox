import { describe, expect, test } from "vitest";
import { decryptFile, getEncryptedFileHeader } from "./decrypt";
import { UnexpectedEofError } from "./bufferedReader";
import {
  CorruptedFileError,
  InvalidFileSignatureError,
  InvalidHeaderError,
  InvalidPrivateKeyError,
  UnsupportedVersionError,
} from "./errors";
import { BufferedWriter } from "../test/bufferWriter";
import { genKeyPair } from "../key/keyPair";
import { encryptFile } from "../encrypt/encrypt";
import {
  ALGORITHMS,
  ENCRYPTED_FILE_MIMETYPE,
  FILE_SIGNATURE,
  FORMAT_VERSION,
} from "../constants";
import { writeFileHeader } from "../encrypt/encrypt";
import { uint32ToBytes } from "../utils/encoding";

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

describe("getEncryptedFileHeader", () => {
  test("reads valid header", async () => {
    const buffer = new BufferedWriter();

    const header = {
      algorithm: ALGORITHMS,
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

    await writeFileHeader(writer, header);
    await writer.close();

    const bytes = await blobToBytes(buffer.toBlob(ENCRYPTED_FILE_MIMETYPE));

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
  test("rejects invalid header", async () => {
    const buffer = new BufferedWriter();
    const writer = buffer.stream.getWriter();
    const encoder = new TextEncoder();
    // valid premable
    await writer.write(encoder.encode(FILE_SIGNATURE));
    await writer.write(Uint8Array.of(FORMAT_VERSION));
    // invalid header
    const headerJson = "}" + JSON.stringify({});
    const headerBytes = encoder.encode(headerJson);
    await writer.write(uint32ToBytes(headerBytes.length));
    await writer.write(headerBytes);
    await writer.close();

    const bytes = await blobToBytes(buffer.toBlob(ENCRYPTED_FILE_MIMETYPE));
    const source = streamFromChunks([bytes]);
    await expect(getEncryptedFileHeader({ source })).rejects.toThrow(
      InvalidHeaderError,
    );
  });
});

describe("decryptFileToStream", () => {
  test("roundtrip encryption and decryption", async () => {
    const recipient = await genKeyPair();

    const plaintext = "Hello LockBox!";

    const encryptedBuffer = new BufferedWriter();

    await encryptFile({
      filename: "test.txt",
      filetype: "text/plain",
      fileSize: plaintext.length,
      source: streamFromChunks([new TextEncoder().encode(plaintext)]),
      publicKey: recipient.publicKey,
      writer: encryptedBuffer.stream.getWriter(),
      onProgress() {},
      onSaved: () => {},
    });

    const encryptedBytes = await blobToBytes(
      encryptedBuffer.toBlob(ENCRYPTED_FILE_MIMETYPE),
    );

    const decryptedBuffer = new BufferedWriter();

    const header = await decryptFile({
      source: streamFromChunks([encryptedBytes]),
      privateKey: recipient.privateKey,
      writer: decryptedBuffer.stream.getWriter(),
      onProgress() {},
      onSaved: () => {},
    });

    const decryptedText = await decryptedBuffer
      .toFile("result.txt", "text/plain")
      .text();

    expect(decryptedText).toBe(plaintext);

    expect(header.originalName).toBe("test.txt");
  });

  test("rejects wrong private key", async () => {
    const recipientA = await genKeyPair();

    const recipientB = await genKeyPair();

    const encryptedBuffer = new BufferedWriter();

    await encryptFile({
      filename: "test.txt",
      filetype: "text/plain",
      fileSize: 4,
      source: streamFromChunks([new TextEncoder().encode("test")]),
      publicKey: recipientA.publicKey,
      writer: encryptedBuffer.stream.getWriter(),
      onProgress() {},
      onSaved: () => {},
    });

    const encryptedBytes = await blobToBytes(
      encryptedBuffer.toBlob(ENCRYPTED_FILE_MIMETYPE),
    );

    await expect(
      decryptFile({
        source: streamFromChunks([encryptedBytes]),
        privateKey: recipientB.privateKey,
        writer: new BufferedWriter().stream.getWriter(),
        onProgress() {},
        onSaved: () => {},
      }),
    ).rejects.toThrow(InvalidPrivateKeyError);
  });

  test("detects tampered ciphertext", async () => {
    const recipient = await genKeyPair();

    const encryptedBuffer = new BufferedWriter();

    await encryptFile({
      filename: "test.txt",
      filetype: "text/plain",
      fileSize: 4,
      source: streamFromChunks([new TextEncoder().encode("test")]),
      publicKey: recipient.publicKey,
      writer: encryptedBuffer.stream.getWriter(),
      onProgress() {},
      onSaved: () => {},
    });

    const encryptedBytes = await blobToBytes(
      encryptedBuffer.toBlob(ENCRYPTED_FILE_MIMETYPE),
    );

    encryptedBytes[encryptedBytes.length - 1] ^= 1;

    await expect(
      decryptFile({
        source: streamFromChunks([encryptedBytes]),
        privateKey: recipient.privateKey,
        writer: new BufferedWriter().stream.getWriter(),
        onProgress() {},
        onSaved: () => {},
      }),
    ).rejects.toThrow(CorruptedFileError);
  });

  test("decrypts empty file", async () => {
    const recipient = await genKeyPair();

    const encryptedBuffer = new BufferedWriter();

    await encryptFile({
      filename: "empty.txt",
      filetype: "text/plain",
      fileSize: 0,
      source: streamFromChunks([]),
      publicKey: recipient.publicKey,
      writer: encryptedBuffer.stream.getWriter(),
      onProgress() {},
      onSaved: () => {},
    });

    const encryptedBytes = await blobToBytes(
      encryptedBuffer.toBlob(ENCRYPTED_FILE_MIMETYPE),
    );

    const decryptedBuffer = new BufferedWriter();

    await decryptFile({
      source: streamFromChunks([encryptedBytes]),
      privateKey: recipient.privateKey,
      writer: decryptedBuffer.stream.getWriter(),
      onProgress() {},
      onSaved: () => {},
    });

    expect(decryptedBuffer.size).toBe(0);
  });
});
