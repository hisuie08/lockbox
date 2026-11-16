// aad.test.ts
import { describe, expect, test } from "vitest";
import { sha256 } from "@noble/hashes/sha2.js";
import {
  AAD_LENGTH,
  HEADER_HASH_LENGTH,
  buildChunkAad,
  hashHeaderBytes,
} from "./aad";

// 期待値の出自について:
// - 公知の定数は、出典を添えて定数として宣言してから使う
// - 他の値から導ける期待値は、実装とは別経路の導出でその場で計算する
// - 値そのものに意味のないもの（サンプルのファイル名やダミーの鍵など）は、
//   テスト内で一貫していればよいので、そのまま使う

// SHA-256 の公知のテストベクタ
const SHA256_OF_ABC_HEX =
  "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
const SHA256_OF_EMPTY_HEX =
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

// ENCFILE2 v4 の仕様で定めたドメイン文字列と、レイアウト上の各部の長さ
const AAD_DOMAIN = "ENCFILE2-v4-chunk";
const AAD_DOMAIN_BYTES = new TextEncoder().encode(AAD_DOMAIN);
const CHUNK_INDEX_LENGTH = 8;
const FINAL_FLAG_LENGTH = 1;

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
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

// uint64 ビッグエンディアンの導出。実装は DataView.setBigUint64 を使うので、
// ここでは BigInt のシフトで1バイトずつ取り出す別経路で導く
function encodeUint64BE(value: number): Uint8Array {
  let rest = BigInt(value);
  const bytes = new Uint8Array(CHUNK_INDEX_LENGTH);
  for (let i = CHUNK_INDEX_LENGTH - 1; i >= 0; i--) {
    bytes[i] = Number(rest & 0xffn);
    rest >>= 8n;
  }
  return bytes;
}

// 00 01 02 ... と、位置を目で追えるようにした32バイト。
// ハッシュの中身そのものに意味はない
const FIXED_HEADER_HASH = Uint8Array.from(
  { length: HEADER_HASH_LENGTH },
  (_, i) => i,
);

describe("hashHeaderBytes", () => {
  test("matches the SHA-256 test vector for 'abc'", async () => {
    const digest = await hashHeaderBytes(new TextEncoder().encode("abc"));
    expect(digest.length).toBe(HEADER_HASH_LENGTH);
    expect(toHex(digest)).toBe(SHA256_OF_ABC_HEX);
  });

  test("matches the SHA-256 test vector for empty input", async () => {
    const digest = await hashHeaderBytes(new Uint8Array());
    expect(toHex(digest)).toBe(SHA256_OF_EMPTY_HEX);
  });

  test("hashes a sample header JSON", async () => {
    // 実物のヘッダーと同じフィールド順のサンプル。
    // フィールドの値そのものに意味はない
    const headerJson =
      '{"algorithm":"X25519-HKDF-SHA256-AES-256-GCM","chunkSize":4194304,' +
      '"ephemeralPublicKey":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",' +
      '"recipientThumbprint":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",' +
      '"originalName":"sample.txt",' +
      '"hkdfSalt":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",' +
      '"originalType":"text/plain","originalSize":14,' +
      '"createdAt":"2026-01-01T00:00:00.000Z"}';
    const headerBytes = new TextEncoder().encode(headerJson);
    // 期待値は、実装（WebCrypto）とは別実装の SHA-256 で導出する
    const expected = sha256(headerBytes);
    expect(await hashHeaderBytes(headerBytes)).toEqual(expected);
  });

  test("produces different hashes for different inputs", async () => {
    const a = await hashHeaderBytes(new TextEncoder().encode('{"a":1}'));
    const b = await hashHeaderBytes(new TextEncoder().encode('{"a":2}'));
    expect(toHex(a)).not.toBe(toHex(b));
  });
});

describe("buildChunkAad", () => {
  test("has a length equal to the sum of its parts", () => {
    const expectedLength =
      AAD_DOMAIN_BYTES.length +
      HEADER_HASH_LENGTH +
      CHUNK_INDEX_LENGTH +
      FINAL_FLAG_LENGTH;
    expect(AAD_LENGTH).toBe(expectedLength);
    expect(buildChunkAad(FIXED_HEADER_HASH, 0, false).length).toBe(
      expectedLength,
    );
  });

  test("lays out domain, header hash, index and flag in order", () => {
    const expected = concatBytes([
      AAD_DOMAIN_BYTES,
      FIXED_HEADER_HASH,
      encodeUint64BE(0),
      Uint8Array.of(0x00), // not final
    ]);
    expect(buildChunkAad(FIXED_HEADER_HASH, 0, false)).toEqual(expected);
  });

  test("encodes the chunk index as uint64 big-endian", () => {
    // 32ビットに収まらない値で、8バイト分が使われることを確認する
    const chunkIndex = 2 ** 32;
    const expected = concatBytes([
      AAD_DOMAIN_BYTES,
      FIXED_HEADER_HASH,
      encodeUint64BE(chunkIndex),
      Uint8Array.of(0x01), // final
    ]);
    expect(buildChunkAad(FIXED_HEADER_HASH, chunkIndex, true)).toEqual(
      expected,
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
    expect(
      () => buildChunkAad(new Uint8Array(HEADER_HASH_LENGTH - 1), 0, false),
    ).toThrow(RangeError);
    expect(
      () => buildChunkAad(new Uint8Array(HEADER_HASH_LENGTH + 1), 0, false),
    ).toThrow(RangeError);
  });

  test("rejects an invalid chunk index", () => {
    expect(() => buildChunkAad(FIXED_HEADER_HASH, -1, false)).toThrow(
      RangeError,
    );
    expect(() => buildChunkAad(FIXED_HEADER_HASH, 1.5, false)).toThrow(
      RangeError,
    );
    expect(
      () =>
        buildChunkAad(FIXED_HEADER_HASH, Number.MAX_SAFE_INTEGER + 1, false),
    ).toThrow(RangeError);
  });
});
