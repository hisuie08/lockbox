import { describe, expect, test } from "vitest";
import {
  algorithm,
  exportAsJwk,
  generate,
  importJwk,
  toPublicJwk,
} from "./x25519";
import { KeyParseError, KeyImportError } from "./errors";
import { parseJwk } from "./validate";

describe("key pair test", () => {
  test("generate keypair", async () => {
    const { publicKey, privateKey } = await generate();
    expect(publicKey.algorithm.name).toBe(algorithm.name);
    expect(privateKey.algorithm.name).toBe(algorithm.name);
    expect(publicKey.extractable).toBe(true);
    expect(privateKey.extractable).toBe(true);
  });
  test("export keypair", async () => {
    const { publicKey, privateKey } = await generate();
    const publicJwk = await exportAsJwk(publicKey);
    const privateJwk = await exportAsJwk(privateKey);
    expect(publicJwk.crv).toBe(algorithm.name);
    expect(privateJwk.crv).toBe(algorithm.name);
    expect(publicJwk.key_ops).toStrictEqual([]);
    expect(privateJwk.key_ops).toContain("deriveBits");
    expect(publicJwk.x).toStrictEqual(privateJwk.x);
    expect(publicJwk.d).toBeUndefined();
    expect(privateJwk.d).toBeTruthy();
  });

  test("import key", async () => {
    const { publicKey, privateKey } = await generate();
    const publicJwk = await exportAsJwk(publicKey);
    const privateJwk = await exportAsJwk(privateKey);
    const pubKey = await importJwk(publicJwk, "public");
    const privKey = await importJwk(privateJwk, "private");
    expect(pubKey.usages).toStrictEqual(publicJwk.key_ops);
    expect(privKey.usages).toStrictEqual(privateJwk.key_ops);
  });

  test("invalid json", () => {
    expect(() => parseJwk("{")).toThrow(KeyParseError);
  });
  test("invalid public key", async () => {
    await expect(importJwk({} as JsonWebKey, "public")).rejects.toThrow(
      KeyImportError,
    );
  });
  test("toPublicJwk should not mutate original", () => {
    const jwk = {
      d: "secret",
      x: "public",
    } as JsonWebKey;

    const publicJwk = toPublicJwk(jwk);
    expect(publicJwk.x).toStrictEqual(jwk.x);

    // 元データは残っていてほしい
    expect(jwk.d).toBe("secret");
  });
});
