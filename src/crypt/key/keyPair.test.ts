import { describe, expect, test } from "vitest";
import { exportAsJwk, genKeyPair, importJwk, toPublicJwk } from "./keyPair";
import type { LockBoxJwk } from "./types";
import { KeyParseError, KeyImportError } from "./errors";
import { parseJwk } from "./validate";

describe("key pair test", () => {
  test("generate keypair", async () => {
    const { publicKey, privateKey } = await genKeyPair();
    expect(publicKey.algorithm.name).toBe("X25519");
    expect(privateKey.algorithm.name).toBe("X25519");
    expect(publicKey.extractable).toBe(true);
    expect(privateKey.extractable).toBe(true);
  });
  test("export keypair", async () => {
    const { publicKey, privateKey } = await genKeyPair();
    const date = new Date();
    const publicJwk = await exportAsJwk(publicKey, date);
    const privateJwk = await exportAsJwk(privateKey, date);
    expect(publicJwk.crv).toBe("X25519");
    expect(privateJwk.crv).toBe("X25519");
    expect(publicJwk.key_ops).toStrictEqual([]);
    expect(privateJwk.key_ops).toContain("deriveBits");
    expect(publicJwk.x).toStrictEqual(privateJwk.x);
    expect(publicJwk.d).toBeUndefined();
    expect(privateJwk.d).toBeTruthy();
    expect(publicJwk.created_at).toBe(date);
    expect(privateJwk.created_at).toBe(date);
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
    } as LockBoxJwk;

    const publicJwk = toPublicJwk(jwk);
    expect(publicJwk.x).toStrictEqual(jwk.x);

    // 元データは残っていてほしい
    expect(jwk.d).toBe("secret");
  });
});
