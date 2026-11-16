import { describe, expect, test } from "vitest";
import { genIv, genSalt } from "./random";

// 仕様上の長さ: HKDF のソルトは32バイト、AES-GCM の IV は12バイト
const SALT_LENGTH = 32;
const IV_LENGTH = 12;

describe("random values", () => {
  test("salt", () => {
    const salt = genSalt();
    expect(salt.byteLength).toBe(SALT_LENGTH);
  });
  test("iv", () => {
    const iv = genIv();
    expect(iv.byteLength).toBe(IV_LENGTH);
  });
  test("generates different value each time", () => {
    const salt1 = genSalt();
    const salt2 = genSalt();
    expect(salt1).not.toBe(salt2);
    const [iv1, iv2] = [genIv(), genIv()];
    expect(iv1).not.toBe(iv2);
  });
});
