import { beforeEach, describe, expect, test } from "vitest";
import {
  CorruptedFileError,
  decryptFileToStream,
  InvalidPrivateKeyError,
} from "./decrypt/decrypt";
import { encryptFileToStream } from "./encrypt/encrypt";
import { genKeyPair } from "./key/keyPair";

import { sha256 } from "@noble/hashes/sha2.js";
import { base64UrlToArrayBuffer } from "./encoding";
import { ALGORITHMS, ENCRYPTED_FILE_MIMETYPE } from "./constants";
import { BufferWriter } from "../lib/bufferWriter";

export class HashWriter {
  private readonly hash = sha256.create();

  readonly stream = new WritableStream<Uint8Array>({
    write: (chunk) => {
      this.hash.update(chunk);
    },
  });

  digest(): string {
    return Array.from(this.hash.digest())
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
}
function createLargeStream(
  totalSize: number,
  sourceChunkSize = 64 * 1024,
): ReadableStream<Uint8Array> {
  let produced = 0;

  return new ReadableStream({
    pull(controller) {
      if (produced >= totalSize) {
        controller.close();
        return;
      }

      const size = Math.min(sourceChunkSize, totalSize - produced);

      const chunk = new Uint8Array(size);

      for (let i = 0; i < size; i++) {
        chunk[i] = (produced + i) % 256;
      }

      produced += size;

      controller.enqueue(chunk);
    },
  });
}

async function hashStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const hash = sha256.create();

  const reader = stream.getReader();

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    hash.update(value);
  }

  return Array.from(hash.digest())
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function createSourceFactory(size: number) {
  return () => createLargeStream(size);
}

describe("encrypt file stream round trip", () => {
  let keyPair: Awaited<ReturnType<typeof genKeyPair>>;
  // encrypt → decrypt を直結
  let pipe: TransformStream<Uint8Array, Uint8Array>;

  beforeEach(async () => {
    keyPair = await genKeyPair();
    pipe = new TransformStream<Uint8Array, Uint8Array>();
  });

  const fileSizes = [
    10,
    100,
    1000,
    10000,
    100000,
    1024 * 1024, // 1MB
    100 * 1024 * 1024, // 100MB
    //1024 * 1024 * 1024, // 1GB
  ];

  for (const fileSize of fileSizes) {
    test(`encrypt/decrypt (${fileSize} bytes)`, async () => {
      const createSource = createSourceFactory(fileSize);

      // 元データの期待ハッシュ
      const expectedHash = await hashStream(createSource());

      const hashWriter = new HashWriter();

      const encryptPromise = encryptFileToStream({
        source: createSource(),
        filename: "test.bin",
        filetype: ENCRYPTED_FILE_MIMETYPE,
        fileSize: fileSize,
        publicKey: keyPair.publicKey,
        writer: pipe.writable.getWriter(),
        onProgress: () => {},
        onSaved: () => {},
      });

      const decryptPromise = decryptFileToStream({
        source: pipe.readable,
        privateKey: keyPair.privateKey,
        writer: hashWriter.stream.getWriter(),
        onProgress: () => {},
        onSaved: () => {},
      });

      const [, header] = await Promise.all([encryptPromise, decryptPromise]);

      // 復号結果ハッシュ
      const actualHash = hashWriter.digest();

      expect(actualHash).toBe(expectedHash);

      // ヘッダ検証
      expect(header.originalName).toBe("test.bin");
      expect(header.originalType).toBe(ENCRYPTED_FILE_MIMETYPE);
      expect(header.originalSize).toBe(fileSize);
      expect(header.algorithm).toBe(ALGORITHMS);
      const ephemeralPubRaw = base64UrlToArrayBuffer(header.ephemeralPublicKey);
      expect(ephemeralPubRaw.byteLength).toBe(32);
    }, 60_000);
  }

  test("empty file roundtrip", async () => {
    const hashWriter = new HashWriter();

    const encryptPromise = encryptFileToStream({
      source: createLargeStream(0),
      filename: "empty.bin",
      filetype: ENCRYPTED_FILE_MIMETYPE,
      fileSize: 0,
      publicKey: keyPair.publicKey,
      writer: pipe.writable.getWriter(),
      onProgress: () => {},
      onSaved: () => {},
    });

    const decryptPromise = decryptFileToStream({
      source: pipe.readable,
      privateKey: keyPair.privateKey,
      writer: hashWriter.stream.getWriter(),
      onProgress: () => {},
      onSaved: () => {},
    });

    const [, header] = await Promise.all([encryptPromise, decryptPromise]);

    expect(hashWriter.digest()).toBe(await hashStream(createLargeStream(0)));

    expect(header.originalSize).toBe(0);
  });

  test("rejects wrong private key", async () => {
    const otherKeyPair = await genKeyPair();

    const encrypted = new BufferWriter();

    await encryptFileToStream({
      source: createLargeStream(100),
      filename: "test.bin",
      filetype: ENCRYPTED_FILE_MIMETYPE,
      fileSize: 100,
      publicKey: keyPair.publicKey,
      writer: encrypted.stream.getWriter(),
      onProgress: () => {},
      onSaved: () => {},
    });

    const encryptedFile = encrypted.toFile("enc.bin", ENCRYPTED_FILE_MIMETYPE);

    await expect(
      decryptFileToStream({
        source: encryptedFile.stream(),
        privateKey: otherKeyPair.privateKey,
        writer: new HashWriter().stream.getWriter(),
        onProgress: () => {},
        onSaved: () => {},
      }),
    ).rejects.toThrow(InvalidPrivateKeyError);
  });

  test("detects tampered ciphertext", async () => {
    const encrypted = new BufferWriter();

    await encryptFileToStream({
      source: createLargeStream(1000),
      filename: "test.bin",
      filetype: ENCRYPTED_FILE_MIMETYPE,
      fileSize: 1000,
      publicKey: keyPair.publicKey,
      writer: encrypted.stream.getWriter(),
      onProgress: () => {},
      onSaved: () => {},
    });

    const bytes = new Uint8Array(
      await encrypted.toBlob(ENCRYPTED_FILE_MIMETYPE).arrayBuffer(),
    );

    bytes[bytes.length - 1] ^= 1;

    const tamperedFile = new File([bytes], "tampered.bin");

    await expect(
      decryptFileToStream({
        source: tamperedFile.stream(),
        privateKey: keyPair.privateKey,
        writer: new HashWriter().stream.getWriter(),
        onProgress: () => {},
        onSaved: () => {},
      }),
    ).rejects.toThrow(CorruptedFileError);
  });
  test("detects tampered empty file", async () => {
    const encrypted = new BufferWriter();

    await encryptFileToStream({
      source: createLargeStream(0),
      filename: "test.bin",
      filetype: ENCRYPTED_FILE_MIMETYPE,
      fileSize: 0,
      publicKey: keyPair.publicKey,
      writer: encrypted.stream.getWriter(),
      onProgress: () => {},
      onSaved: () => {},
    });

    const bytes = new Uint8Array(
      await encrypted.toBlob(ENCRYPTED_FILE_MIMETYPE).arrayBuffer(),
    );

    bytes[bytes.length - 1] ^= 1;

    const tamperedFile = new File([bytes], "tampered.bin");

    await expect(
      decryptFileToStream({
        source: tamperedFile.stream(),
        privateKey: keyPair.privateKey,
        writer: new HashWriter().stream.getWriter(),
        onProgress: () => {},
        onSaved: () => {},
      }),
    ).rejects.toThrow(CorruptedFileError);
  });
});
