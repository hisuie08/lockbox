import { describe, expect, it } from "vitest";
import { ArrayBufferChunkReader, StreamChunkReader } from "./chunkReader";
import { InputReadError } from "../errors";

function createStream(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });
}

describe("StreamChunkReader", () => {
  it("returns a single full chunk", async () => {
    const reader = new StreamChunkReader(
      createStream([Uint8Array.from([1, 2, 3, 4])]),
      4,
    );

    expect(await reader.readChunk()).toEqual(Uint8Array.from([1, 2, 3, 4]));
    expect(await reader.readChunk()).toBeNull();
  });

  it("merges multiple reads into one chunk", async () => {
    const reader = new StreamChunkReader(
      createStream([
        Uint8Array.from([1, 2]),
        Uint8Array.from([3]),
        Uint8Array.from([4, 5]),
      ]),
      4,
    );

    expect(await reader.readChunk()).toEqual(Uint8Array.from([1, 2, 3, 4]));
    expect(await reader.readChunk()).toEqual(Uint8Array.from([5]));
    expect(await reader.readChunk()).toBeNull();
  });

  it("returns the final partial chunk", async () => {
    const reader = new StreamChunkReader(
      createStream([Uint8Array.from([1, 2, 3])]),
      4,
    );

    expect(await reader.readChunk()).toEqual(Uint8Array.from([1, 2, 3]));
    expect(await reader.readChunk()).toBeNull();
  });

  it("returns null for an empty stream", async () => {
    const reader = new StreamChunkReader(createStream([]), 4);

    expect(await reader.readChunk()).toBeNull();
  });

  it("throws InputReadError when the stream fails", async () => {
    const stream = new ReadableStream<Uint8Array>({
      pull() {
        throw new Error("boom");
      },
    });

    const reader = new StreamChunkReader(stream, 4);

    await expect(reader.readChunk()).rejects.toBeInstanceOf(InputReadError);
  });
  it("keeps the remaining bytes after returning a full chunk", async () => {
    const reader = new StreamChunkReader(
      createStream([Uint8Array.from([1, 2, 3, 4, 5, 6, 7])]),
      4,
    );

    expect(await reader.readChunk()).toEqual(Uint8Array.from([1, 2, 3, 4]));
    expect(await reader.readChunk()).toEqual(Uint8Array.from([5, 6, 7]));
    expect(await reader.readChunk()).toBeNull();
  });
});

describe("ArrayBufferChunkReader", () => {
  it("splits into fixed-size chunks", async () => {
    const reader = new ArrayBufferChunkReader(
      Uint8Array.from([1, 2, 3, 4, 5]),
      2,
    );

    expect(await reader.readChunk()).toEqual(Uint8Array.from([1, 2]));
    expect(await reader.readChunk()).toEqual(Uint8Array.from([3, 4]));
    expect(await reader.readChunk()).toEqual(Uint8Array.from([5]));
    expect(await reader.readChunk()).toBeNull();
  });

  it("returns null for an empty buffer", async () => {
    const reader = new ArrayBufferChunkReader(new Uint8Array(), 4);

    expect(await reader.readChunk()).toBeNull();
  });
});
