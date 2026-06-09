import { beforeAll, describe, expect, it } from "vitest";
import { decryptFileToStream } from "./decryptStream";
import { encryptFileToStream } from "./encryptStream";
import { genKeyPair } from "./genKeyPair";

import { sha256 } from "@noble/hashes/sha2.js";

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

describe("encrypted file stream", () => {
  let keyPair: Awaited<ReturnType<typeof genKeyPair>>;

  beforeAll(async () => {
    keyPair = await genKeyPair();
  });

  const fileSizes = [
    0,
    10,
    100,
    1000,
    10000,
    100000,
    1024 * 1024, // 1MB
    100 * 1024 * 1024, // 100MB
    1024 * 1024 * 1024, // 1GB
  ];

  for (const fileSize of fileSizes) {
    it(`encrypt/decrypt (${fileSize} bytes)`, async () => {
      const createSource = createSourceFactory(fileSize);

      //
      // 元データの期待ハッシュ
      //

      const expectedHash = await hashStream(createSource());

      //
      // encrypt → decrypt を直結
      //

      const pipe = new TransformStream<Uint8Array, Uint8Array>();

      const hashWriter = new HashWriter();

      const encryptPromise = encryptFileToStream({
        source: createSource(),
        filename: "test.bin",
        filetype: "application/octet-stream",
        fileSize: fileSize,
        publicKey: keyPair.publicKey,
        writer: pipe.writable.getWriter(),
        onProgress: () => {},
      });

      const decryptPromise = decryptFileToStream({
        source: pipe.readable,
        privateKey: keyPair.privateKey,
        writer: hashWriter.stream.getWriter(),
        onProgress: () => {},
      });

      const [, header] = await Promise.all([encryptPromise, decryptPromise]);

      //
      // 復号結果ハッシュ
      //

      const actualHash = hashWriter.digest();

      expect(actualHash).toBe(expectedHash);

      //
      // ヘッダ検証
      //

      expect(header.originalName).toBe("test.bin");

      expect(header.originalType).toBe("application/octet-stream");

      expect(header.originalSize).toBe(fileSize);

      expect(header.algorithm).toBe("AES-GCM");

      expect(header.rsaAlgorithm).toBe("RSA-OAEP");

      expect(header.encryptedKey).toBeTruthy();
    }, 60_000);
  }
});
