import { describe, expect, test } from "vitest";
import {
  PREAMBLE_LENGTHS,
  PREAMBLE_LAYOUT,
  FILE_SIGNATURE,
  FORMAT_VERSION,
  CHUNK_HEADER_LENGTHS,
  CHUNK_HEADER_LAYOUT,
} from "./constants";

describe("Binary format specification", () => {
  test("Verify file signature", () => {
    const sigBytes = new TextEncoder().encode(FILE_SIGNATURE);
    expect(sigBytes.byteLength).toStrictEqual(PREAMBLE_LENGTHS.FILE_SIGNATURE);
  });
  test("Verify version", () => {
    const UINT8_MAX = 0b11111111; // 255
    expect(FORMAT_VERSION).toBeLessThanOrEqual(UINT8_MAX);
  });
  test("verify premable layout", () => {
    expect(PREAMBLE_LENGTHS).toEqual({
      FILE_SIGNATURE: 8,
      FORMAT_VERSION: 1,
      HEADER_LENGTH: 4,
    });
    expect(PREAMBLE_LAYOUT).toEqual({
      SIGNATURE_OFFSET: 0,
      VERSION_OFFSET: 8,
      HEADER_LENGTH_OFFSET: 9,
      HEADER_OFFSET: 13,
    });
  });
  test("verify chunk header layout", () => {
    expect(CHUNK_HEADER_LENGTHS).toEqual({
      CIPHERTEXT_LENGTH: 4,
      IV_LENGTH: 4,
    });
    expect(CHUNK_HEADER_LAYOUT).toEqual({
      LENGTH_OFFSET: 0,
      IV_OFFSET: 4,
    });
  });
});
