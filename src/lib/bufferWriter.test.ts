import { describe, expect, test } from "vitest";
import { BufferWriter } from "./bufferWriter";

describe("BufferWriter", () => {
  test("collects chunks", async () => {
    const writer = new BufferWriter();

    const streamWriter = writer.stream.getWriter();

    await streamWriter.write(new TextEncoder().encode("Hello "));

    await streamWriter.write(new TextEncoder().encode("World"));

    await streamWriter.close();

    expect(writer.size).toBe(11);
  });
  test("creates blob", async () => {
    const writer = new BufferWriter();

    const streamWriter = writer.stream.getWriter();

    await streamWriter.write(new TextEncoder().encode("Hello"));

    await streamWriter.close();

    const blob = writer.toBlob("text/plain");

    expect(blob.type).toBe("text/plain");
    expect(await blob.text()).toBe("Hello");
  });
  test("creates file", async () => {
    const writer = new BufferWriter();

    const streamWriter = writer.stream.getWriter();

    await streamWriter.write(new TextEncoder().encode("Hello"));

    await streamWriter.close();

    const file = writer.toFile("hello.txt", "text/plain");

    expect(file.name).toBe("hello.txt");
    expect(await file.text()).toBe("Hello");
  });
  test("clears buffer", async () => {
    const writer = new BufferWriter();

    const streamWriter = writer.stream.getWriter();

    await streamWriter.write(new Uint8Array([1, 2, 3]));

    await streamWriter.close();

    expect(writer.size).toBe(3);

    writer.clear();

    expect(writer.size).toBe(0);
  });
});
