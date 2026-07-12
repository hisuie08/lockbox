import { describe, expect, test } from "vitest";
import { ArrayBufferByteReader, StreamByteReader } from "./byteReader";

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

const createStreamReader = (chunks: Uint8Array[]) =>
  new StreamByteReader(streamFromChunks(chunks));

const createArrayBufferReader = (chunks: Uint8Array[]) => {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const bytes = new Uint8Array(length);

  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }

  return new ArrayBufferByteReader(bytes);
};

describe.each([
  ["StreamByteReader", createStreamReader],
  ["ArrayBufferByteReader", createArrayBufferReader],
])("%s", (_, createReader) => {
  test("reads exact length", async () => {
    const reader = createReader([new Uint8Array([1, 2, 3, 4])]);

    const bytes = await reader.readBytes(4);

    expect(Array.from(bytes)).toEqual([1, 2, 3, 4]);
  });

  test("reads across multiple chunks", async () => {
    const reader = createReader([
      new Uint8Array([1, 2]),
      new Uint8Array([3, 4]),
    ]);

    const bytes = await reader.readBytes(4);

    expect(Array.from(bytes)).toEqual([1, 2, 3, 4]);
  });

  test("preserves remaining buffer", async () => {
    const reader = createReader([new Uint8Array([1, 2, 3, 4])]);

    expect(Array.from(await reader.readBytes(2))).toEqual([1, 2]);
    expect(Array.from(await reader.readBytes(2))).toEqual([3, 4]);
  });

  test("tryReadBytes returns null at eof", async () => {
    const reader = createReader([]);

    await expect(reader.tryReadBytes(8)).resolves.toBeNull();
  });

  test("throws on unexpected eof", async () => {
    const reader = createReader([new Uint8Array([1, 2])]);

    await expect(reader.readBytes(8)).rejects.toThrow();
  });

  test("tryReadBytes throws when data ends partway through", async () => {
    const reader = createReader([new Uint8Array([1, 2])]);

    await expect(reader.tryReadBytes(8)).rejects.toThrow();
  });

  test("can continue reading after multiple calls", async () => {
    const reader = createReader([
      new Uint8Array([1, 2]),
      new Uint8Array([3, 4]),
      new Uint8Array([5, 6]),
    ]);

    expect(Array.from(await reader.readBytes(3))).toEqual([1, 2, 3]);
    expect(Array.from(await reader.readBytes(2))).toEqual([4, 5]);
    expect(Array.from(await reader.readBytes(1))).toEqual([6]);
    await expect(reader.tryReadBytes(1)).resolves.toBeNull();
  });
});
