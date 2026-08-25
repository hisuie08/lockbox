import { describe, expect, test } from "vitest";
import {
  algorithm,
  exportAsJwk,
  generate,
  importJwk,
  toPublicJwk,
  canonicalizeX25519Jwk,
  getThumbprint,
  validateX25519Jwk,
  parseJwk,
} from "./x25519";
import { KeyParseError, KeyImportError } from "./errors";

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

describe("validateX25519Jwk", () => {
  const publicJwk = {
    kty: "OKP",
    crv: "X25519",
    x: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  };

  const privateJwk = {
    ...publicJwk,
    d: "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
  };

  test("accepts valid public key", () => {
    const result = validateX25519Jwk(publicJwk);

    expect(result.valid).toBe(true);

    if (result.valid) {
      expect(result.keyType).toBe("public");
      expect(result.jwk).toEqual(publicJwk);
    }
  });

  test("accepts valid private key", () => {
    const result = validateX25519Jwk(privateJwk);

    expect(result.valid).toBe(true);

    if (result.valid) {
      expect(result.keyType).toBe("private");
      expect(result.jwk).toEqual(privateJwk);
    }
  });

  test("rejects non-object values", () => {
    const result = validateX25519Jwk("not a jwk");

    expect(result.valid).toBe(false);

    if (!result.valid) {
      expect(result.errors).toContain("JWK must be an object");
    }
  });

  test.each([
    [{ ...publicJwk, kty: "RSA" }, "kty must be OKP"],
    [{ ...publicJwk, crv: "P-256" }, "crv must be X25519"],
    [{ ...publicJwk, x: "abc+123" }, "x is missing or invalid"],
  ])("rejects invalid field", (jwk, expectedError) => {
    const result = validateX25519Jwk(jwk);

    expect(result.valid).toBe(false);

    if (!result.valid) {
      expect(result.errors).toContain(expectedError);
    }
  });

  test("rejects invalid private key material", () => {
    const result = validateX25519Jwk({
      ...publicJwk,
      d: "invalid+base64",
    });

    expect(result.valid).toBe(false);

    if (!result.valid) {
      expect(result.errors).toContain("Invalid X25519 JWK");
    }
  });

  test("collects multiple validation errors", () => {
    const result = validateX25519Jwk({
      kty: "RSA",
      crv: "P-256",
      x: "",
    });

    expect(result.valid).toBe(false);

    if (!result.valid) {
      expect(result.errors).toContain("kty must be OKP");
      expect(result.errors).toContain("crv must be X25519");
      expect(result.errors).toContain("x is missing or invalid");
    }
  });
});

describe("canonicalizeX25519Jwk", () => {
  test("returns RFC7638 canonical representation", () => {
    const jwk = {
      x: "xxx",
      crv: "X25519",
      kty: "OKP",
      d: "secret",
      kid: "ignored",
    };

    expect(canonicalizeX25519Jwk(jwk)).toBe(
      '{"crv":"X25519","kty":"OKP","x":"xxx"}',
    );
  });

  test.each([
    [{} as JsonWebKey, "empty object"],
    [{ kty: "RSA", crv: "X25519", x: "xxx" }, "wrong kty"],
    [{ kty: "OKP", crv: "P-256", x: "xxx" }, "wrong crv"],
    [{ kty: "OKP", crv: "X25519" }, "missing x"],
  ])("throws on invalid jwk (%s)", (jwk) => {
    expect(() => canonicalizeX25519Jwk(jwk)).toThrow("Invalid X25519 JWK");
  });
});

describe("getThumbprint", () => {
  const jwk1 = {
    kty: "OKP",
    crv: "X25519",
    x: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  };

  const jwk2 = {
    kty: "OKP",
    crv: "X25519",
    x: "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
  };

  test("returns empty string for null", async () => {
    await expect(getThumbprint(null)).resolves.toBe("");
  });

  test("returns stable thumbprint", async () => {
    const thumb1 = await getThumbprint(jwk1);
    const thumb2 = await getThumbprint(jwk1);

    expect(thumb1).toBe(thumb2);
  });

  test("same public key gives same thumbprint", async () => {
    const thumbPublic = await getThumbprint(jwk1);

    const thumbPrivate = await getThumbprint({
      ...jwk1,
      d: "secret",
    });

    expect(thumbPublic).toBe(thumbPrivate);
  });

  test("different keys produce different thumbprints", async () => {
    const thumb1 = await getThumbprint(jwk1);
    const thumb2 = await getThumbprint(jwk2);

    expect(thumb1).not.toBe(thumb2);
  });
});
