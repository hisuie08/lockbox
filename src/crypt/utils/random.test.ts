import { describe, expect, test } from "vitest";
import { genIv, genSalt } from "./random";

describe("random values", () => {
  test("salt", () => {
    const salt = genSalt();
    expect(salt.byteLength).toBe(32);
  });
  test("iv", () => {
    const iv = genIv();
    expect(iv.byteLength).toBe(12);
  });
  test("generates different value each time", () => {
    const salt1 = genSalt();
    const salt2 = genSalt();
    expect(salt1).not.toBe(salt2);
    const [iv1, iv2] = [genIv(), genIv()];
    expect(iv1).not.toBe(iv2);
  });
});
