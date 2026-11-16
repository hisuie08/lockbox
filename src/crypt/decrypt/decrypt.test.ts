import { describe, expect, test } from "vitest";
import { decryptFile, getEncryptedFileHeader } from "./decrypt";
import { UnexpectedEofError } from "@/stream/bufferedReader";
import {
  CorruptedFileError,
  InvalidFileSignatureError,
  InvalidHeaderError,
  InvalidPrivateKeyError,
  UnsupportedVersionError,
} from "./errors";
import { BufferedWriter } from "../test/bufferWriter";
import { generate } from "../key/x25519";
import { encryptFile } from "../encrypt/encrypt";
import {
  ALGORITHMS,
  CHUNK_HEADER_LAYOUT,
  CHUNK_HEADER_LENGTHS,
  DEFAULT_CHUNK_SIZE,
  ENCRYPTED_FILE_MIMETYPE,
  FILE_SIGNATURE,
  FORMAT_VERSION,
  PREAMBLE_LAYOUT,
  PREAMBLE_LENGTHS,
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

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

// チャンクが2つになるサイズ（DEFAULT_CHUNK_SIZE + 4バイト）で暗号化し、
// プリアンブル＋ヘッダーと、チャンクのバイト列に分解して返す
async function encryptTwoChunkFile(): Promise<{
  recipient: Awaited<ReturnType<typeof generate>>;
  encryptedBytes: Uint8Array;
  head: Uint8Array;
  chunks: Uint8Array[];
}> {
  const recipient = await generate();

  const plaintext = new Uint8Array(DEFAULT_CHUNK_SIZE + 4);
  for (let i = 0; i < plaintext.length; i++) {
    plaintext[i] = i % 251;
  }

  const encryptedBuffer = new BufferedWriter();

  await encryptFile({
    filename: "test.bin",
    filetype: "application/octet-stream",
    fileSize: plaintext.length,
    source: streamFromChunks([plaintext]),
    publicKey: recipient.publicKey,
    writer: encryptedBuffer.stream.getWriter(),
    onProgress() {},
  });

  const encryptedBytes = await blobToBytes(
    encryptedBuffer.toBlob(ENCRYPTED_FILE_MIMETYPE),
  );

  const headerLength = new DataView(
    encryptedBytes.buffer,
    encryptedBytes.byteOffset + PREAMBLE_LAYOUT.HEADER_LENGTH_OFFSET,
    PREAMBLE_LENGTHS.HEADER_LENGTH,
  ).getUint32(0);

  let offset = PREAMBLE_LAYOUT.HEADER_OFFSET + headerLength;
  const head = encryptedBytes.slice(0, offset);
  const chunks: Uint8Array[] = [];
  const chunkHeaderLength =
    CHUNK_HEADER_LENGTHS.CIPHERTEXT_LENGTH + CHUNK_HEADER_LENGTHS.IV_LENGTH;
  while (offset < encryptedBytes.length) {
    const view = new DataView(
      encryptedBytes.buffer,
      encryptedBytes.byteOffset + offset,
      chunkHeaderLength,
    );
    const total =
      chunkHeaderLength +
      view.getUint32(CHUNK_HEADER_LAYOUT.IV_OFFSET) +
      view.getUint32(CHUNK_HEADER_LAYOUT.LENGTH_OFFSET);
    chunks.push(encryptedBytes.slice(offset, offset + total));
    offset += total;
  }

  return { recipient, encryptedBytes, head, chunks };
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
    const recipient = await generate();

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
    });

    const decryptedText = await decryptedBuffer
      .toFile("result.txt", "text/plain")
      .text();

    expect(decryptedText).toBe(plaintext);

    expect(header.originalName).toBe("test.txt");
  });

  test("rejects wrong private key", async () => {
    const recipientA = await generate();

    const recipientB = await generate();

    const encryptedBuffer = new BufferedWriter();

    await encryptFile({
      filename: "test.txt",
      filetype: "text/plain",
      fileSize: 4,
      source: streamFromChunks([new TextEncoder().encode("test")]),
      publicKey: recipientA.publicKey,
      writer: encryptedBuffer.stream.getWriter(),
      onProgress() {},
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
      }),
    ).rejects.toThrow(InvalidPrivateKeyError);
  });

  test("detects tampered ciphertext", async () => {
    const recipient = await generate();

    const encryptedBuffer = new BufferedWriter();

    await encryptFile({
      filename: "test.txt",
      filetype: "text/plain",
      fileSize: 4,
      source: streamFromChunks([new TextEncoder().encode("test")]),
      publicKey: recipient.publicKey,
      writer: encryptedBuffer.stream.getWriter(),
      onProgress() {},
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
      }),
    ).rejects.toThrow(CorruptedFileError);
  });

  test("rejects when decrypted size does not match header", async () => {
    const recipient = await generate();

    const plaintext = new TextEncoder().encode("test");

    const encryptedBuffer = new BufferedWriter();

    await encryptFile({
      filename: "test.txt",
      filetype: "text/plain",
      fileSize: plaintext.length,
      source: streamFromChunks([plaintext]),
      publicKey: recipient.publicKey,
      writer: encryptedBuffer.stream.getWriter(),
      onProgress() {},
    });

    const encryptedBytes = await blobToBytes(
      encryptedBuffer.toBlob(ENCRYPTED_FILE_MIMETYPE),
    );

    // チャンクには手を触れず、ヘッダーの originalSize だけを書き換える
    const headerLength = new DataView(
      encryptedBytes.buffer,
      encryptedBytes.byteOffset + PREAMBLE_LAYOUT.HEADER_LENGTH_OFFSET,
      PREAMBLE_LENGTHS.HEADER_LENGTH,
    ).getUint32(0);
    const header = JSON.parse(
      new TextDecoder().decode(
        encryptedBytes.subarray(
          PREAMBLE_LAYOUT.HEADER_OFFSET,
          PREAMBLE_LAYOUT.HEADER_OFFSET + headerLength,
        ),
      ),
    );
    header.originalSize += 1;
    const newHeaderBytes = new TextEncoder().encode(JSON.stringify(header));
    const tampered = new Uint8Array([
      ...encryptedBytes.subarray(0, PREAMBLE_LAYOUT.HEADER_LENGTH_OFFSET),
      ...uint32ToBytes(newHeaderBytes.length),
      ...newHeaderBytes,
      ...encryptedBytes.subarray(PREAMBLE_LAYOUT.HEADER_OFFSET + headerLength),
    ]);

    await expect(
      decryptFile({
        source: streamFromChunks([tampered]),
        privateKey: recipient.privateKey,
        writer: new BufferedWriter().stream.getWriter(),
        onProgress() {},
      }),
    ).rejects.toThrow(CorruptedFileError);
  });

  test("rejects swapped chunks", async () => {
    const { recipient, head, chunks } = await encryptTwoChunkFile();
    expect(chunks.length).toBe(2);

    const tampered = concatBytes([head, chunks[1], chunks[0]]);

    await expect(
      decryptFile({
        source: streamFromChunks([tampered]),
        privateKey: recipient.privateKey,
        writer: new BufferedWriter().stream.getWriter(),
        onProgress() {},
      }),
    ).rejects.toThrow(CorruptedFileError);
  });

  test("rejects a file missing its final chunk", async () => {
    const { recipient, head, chunks } = await encryptTwoChunkFile();

    const tampered = concatBytes([head, chunks[0]]);

    await expect(
      decryptFile({
        source: streamFromChunks([tampered]),
        privateKey: recipient.privateKey,
        writer: new BufferedWriter().stream.getWriter(),
        onProgress() {},
      }),
    ).rejects.toThrow(CorruptedFileError);
  });

  test("rejects trailing bytes after the final chunk", async () => {
    const { recipient, encryptedBytes } = await encryptTwoChunkFile();

    const tampered = concatBytes([encryptedBytes, new Uint8Array([1, 2, 3])]);

    // チャンクヘッダーを読み切れない端数はリーダー側で検出される
    await expect(
      decryptFile({
        source: streamFromChunks([tampered]),
        privateKey: recipient.privateKey,
        writer: new BufferedWriter().stream.getWriter(),
        onProgress() {},
      }),
    ).rejects.toThrow(UnexpectedEofError);
  });

  test("decrypts empty file", async () => {
    const recipient = await generate();

    const encryptedBuffer = new BufferedWriter();

    await encryptFile({
      filename: "empty.txt",
      filetype: "text/plain",
      fileSize: 0,
      source: streamFromChunks([]),
      publicKey: recipient.publicKey,
      writer: encryptedBuffer.stream.getWriter(),
      onProgress() {},
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
    });

    expect(decryptedBuffer.size).toBe(0);
  });
});
