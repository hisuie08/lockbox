// aad.test.ts
import { describe, expect, test } from "vitest";
import { AAD_LENGTH, buildChunkAad, hashHeaderBytes } from "./aad";

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// 00 01 02 ... 1f の32バイトを固定のヘッダーハッシュとして使う
const FIXED_HEADER_HASH = fromHex(
  "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f",
);

describe("hashHeaderBytes", () => {
  test("matches the SHA-256 test vector for 'abc'", async () => {
    const digest = await hashHeaderBytes(new TextEncoder().encode("abc"));
    expect(digest.length).toBe(32);
    expect(toHex(digest)).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  test("matches the SHA-256 test vector for empty input", async () => {
    const digest = await hashHeaderBytes(new Uint8Array());
    expect(toHex(digest)).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  test("hashes a sample header JSON to a fixed value", async () => {
    const headerJson =
      '{"algorithm":"X25519-HKDF-SHA256-AES-256-GCM","chunkSize":4194304,' +
      '"ephemeralPublicKey":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",' +
      '"recipientThumbprint":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",' +
      '"originalName":"sample.txt",' +
      '"hkdfSalt":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",' +
      '"originalType":"text/plain","originalSize":14,' +
      '"createdAt":"2026-01-01T00:00:00.000Z"}';
    const digest = await hashHeaderBytes(new TextEncoder().encode(headerJson));
    expect(toHex(digest)).toBe(
      "9b4e1b3dd81bc117283b2450aedd6ed8df10987118f3d196df03ec37c749051b",
    );
  });

  test("produces different hashes for different inputs", async () => {
    const a = await hashHeaderBytes(new TextEncoder().encode('{"a":1}'));
    const b = await hashHeaderBytes(new TextEncoder().encode('{"a":2}'));
    expect(toHex(a)).not.toBe(toHex(b));
  });
});

describe("buildChunkAad", () => {
  test("has a fixed total length", () => {
    expect(AAD_LENGTH).toBe(58);
    expect(buildChunkAad(FIXED_HEADER_HASH, 0, false).length).toBe(58);
  });

  test("lays out domain, header hash, index and flag in order", () => {
    expect(toHex(buildChunkAad(FIXED_HEADER_HASH, 0, false))).toBe(
      "454e4346494c45322d76342d6368756e6b" + // "ENCFILE2-v4-chunk"
        "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f" +
        "0000000000000000" + // chunk index 0
        "00", // not final
    );
  });

  test("encodes the chunk index as uint64 big-endian", () => {
    expect(toHex(buildChunkAad(FIXED_HEADER_HASH, 4294967296, true))).toBe(
      "454e4346494c45322d76342d6368756e6b" +
        "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f" +
        "0000000100000000" + // chunk index 2^32
        "01", // final
    );
  });

  test("the final flag changes only the last byte", () => {
    const notFinal = buildChunkAad(FIXED_HEADER_HASH, 3, false);
    const final = buildChunkAad(FIXED_HEADER_HASH, 3, true);
    expect(notFinal.slice(0, -1)).toEqual(final.slice(0, -1));
    expect(notFinal.at(-1)).toBe(0x00);
    expect(final.at(-1)).toBe(0x01);
  });

  test("different indices produce different AADs", () => {
    const a = buildChunkAad(FIXED_HEADER_HASH, 0, false);
    const b = buildChunkAad(FIXED_HEADER_HASH, 1, false);
    expect(toHex(a)).not.toBe(toHex(b));
  });

  test("rejects a header hash of the wrong length", () => {
    expect(() => buildChunkAad(new Uint8Array(31), 0, false)).toThrow(
      RangeError,
    );
    expect(() => buildChunkAad(new Uint8Array(33), 0, false)).toThrow(
      RangeError,
    );
  });

  test("rejects an invalid chunk index", () => {
    expect(() => buildChunkAad(FIXED_HEADER_HASH, -1, false)).toThrow(
      RangeError,
    );
    expect(() => buildChunkAad(FIXED_HEADER_HASH, 1.5, false)).toThrow(
      RangeError,
    );
    expect(() => buildChunkAad(FIXED_HEADER_HASH, 2 ** 53, false)).toThrow(
      RangeError,
    );
  });
});
