import { describe, expect, test } from "vitest";
import { BufferedReader } from "../bufferio/bufferReader";

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
