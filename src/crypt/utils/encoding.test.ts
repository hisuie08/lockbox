// encoding.test.ts
import { describe, expect, test } from "vitest";
import {
  arrayBufferToBase64Url,
  base64UrlToArrayBuffer,
  bytesToBase64Url,
  isBase64Url,
  uint32ToBytes,
} from "./encoding";

describe("isBase64Url", () => {
  test("accepts valid base64url strings", () => {
    expect(isBase64Url("abc123")).toBe(true);
    expect(isBase64Url("abc_DEF-123")).toBe(true);
    expect(isBase64Url("A")).toBe(true);
  });

  test("rejects invalid values", () => {
    expect(isBase64Url("")).toBe(false);
    expect(isBase64Url("abc+123")).toBe(false);
    expect(isBase64Url("abc/123")).toBe(false);
    expect(isBase64Url("abc=123")).toBe(false);
    expect(isBase64Url(null)).toBe(false);
    expect(isBase64Url(undefined)).toBe(false);
    expect(isBase64Url(123)).toBe(false);
    expect(isBase64Url({})).toBe(false);
  });
});

describe("uint32ToBytes", () => {
  test("encodes uint32 as big-endian bytes", () => {
    expect(Array.from(uint32ToBytes(0x12345678))).toEqual([
      0x12, 0x34, 0x56, 0x78,
    ]);
  });

  test("handles boundary values", () => {
    expect(Array.from(uint32ToBytes(0))).toEqual([0, 0, 0, 0]);

    expect(Array.from(uint32ToBytes(0xffffffff))).toEqual([255, 255, 255, 255]);
  });
});

describe("bytesToBase64Url / base64UrlToArrayBuffer", () => {
  test.each([0, 1, 2, 3, 32, 255, 1024])(
    "roundtrip preserves bytes (size=%i)",
    (size) => {
      const original = crypto.getRandomValues(new Uint8Array(size));

      const encoded = bytesToBase64Url(original);
      const decoded = new Uint8Array(base64UrlToArrayBuffer(encoded));

      expect(decoded).toEqual(original);
    },
  );

  test.each([
    ["f", "Zg"],
    ["fo", "Zm8"],
    ["foo", "Zm9v"],
    ["foob", "Zm9vYg"],
    ["fooba", "Zm9vYmE"],
    ["foobar", "Zm9vYmFy"],
  ])("encodes known vector %s", (input, expected) => {
    const bytes = new TextEncoder().encode(input);

    expect(bytesToBase64Url(bytes)).toBe(expected);
  });

  test("decoded output matches original text", () => {
    const text = "Hello, LockBox!";

    const encoded = bytesToBase64Url(new TextEncoder().encode(text));

    const decoded = new TextDecoder().decode(base64UrlToArrayBuffer(encoded));

    expect(decoded).toBe(text);
  });
});

describe("arrayBufferToBase64Url", () => {
  test("produces the same output as bytesToBase64Url", () => {
    const bytes = crypto.getRandomValues(new Uint8Array(32));

    expect(arrayBufferToBase64Url(bytes.buffer)).toBe(bytesToBase64Url(bytes));
  });
});
