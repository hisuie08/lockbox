import { describe, expect, test } from "vitest";
import {
  BYTE_LENGTHS,
  FILE_LAYOUT,
  FILE_SIGNATURE,
  FORMAT_VERSION,
} from "./constants";

describe("Binary format specification", () => {
  test("Verify file signature", () => {
    const sigBytes = new TextEncoder().encode(FILE_SIGNATURE);
    expect(sigBytes.byteLength).toStrictEqual(BYTE_LENGTHS.FILE_SIGNATURE);
  });
  test("Verify version", () => {
    const UINT8_MAX = 0b11111111; // 255
    expect(FORMAT_VERSION).toBeLessThanOrEqual(UINT8_MAX);
  });
  test("verify binary layout", () => {
    expect(BYTE_LENGTHS).toEqual({
      FILE_SIGNATURE: 8,
      FORMAT_VERSION: 1,
      HEADER_LENGTH: 4,
    });
    expect(FILE_LAYOUT).toEqual({
      SIGNATURE_OFFSET: 0,
      VERSION_OFFSET: 8,
      HEADER_LENGTH_OFFSET: 9,
      HEADER_OFFSET: 13,
    });
  });
});
