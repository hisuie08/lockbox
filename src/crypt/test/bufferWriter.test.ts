import { describe, expect, test } from "vitest";
import { BufferedWriter } from "./bufferWriter";

describe("BufferWriter", () => {
  test("collects chunks", async () => {
    const writer = new BufferedWriter();

    const streamWriter = writer.stream.getWriter();

    const first = new TextEncoder().encode("Hello ");
    const second = new TextEncoder().encode("World");

    await streamWriter.write(first);

    await streamWriter.write(second);

    await streamWriter.close();

    expect(writer.size).toBe(first.byteLength + second.byteLength);
  });
  test("creates blob", async () => {
    const writer = new BufferedWriter();

    const streamWriter = writer.stream.getWriter();

    await streamWriter.write(new TextEncoder().encode("Hello"));

    await streamWriter.close();

    const blob = writer.toBlob("text/plain");

    expect(blob.type).toBe("text/plain");
    expect(await blob.text()).toBe("Hello");
  });
  test("creates file", async () => {
    const writer = new BufferedWriter();

    const streamWriter = writer.stream.getWriter();

    await streamWriter.write(new TextEncoder().encode("Hello"));

    await streamWriter.close();

    const file = writer.toFile("hello.txt", "text/plain");

    expect(file.name).toBe("hello.txt");
    expect(await file.text()).toBe("Hello");
  });
  test("clears buffer", async () => {
    const writer = new BufferedWriter();

    const streamWriter = writer.stream.getWriter();

    const chunk = new Uint8Array([1, 2, 3]);

    await streamWriter.write(chunk);

    await streamWriter.close();

    expect(writer.size).toBe(chunk.byteLength);

    writer.clear();

    expect(writer.size).toBe(0);
  });
});
