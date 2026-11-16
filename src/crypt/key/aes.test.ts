import { beforeAll, describe, expect, test } from "vitest";
import { generate } from "./x25519";
import { deriveKey, encrypt, decrypt } from "./aes";
import { buildChunkAad, HEADER_HASH_LENGTH } from "../aad";
import { genIv, genSalt } from "../utils/random";
import { KeyDerivationError } from "./errors";
describe("aes key", () => {
  let recipientKeyPair: CryptoKeyPair;
  let ephemeralKeyPair: CryptoKeyPair;
  const salt = genSalt();
  beforeAll(async () => {
    [recipientKeyPair, ephemeralKeyPair] = await Promise.all([
      generate(),
      generate(),
    ]);
  });
  test("for encryption", async () => {
    const derivedAES = await deriveKey(
      recipientKeyPair.publicKey,
      ephemeralKeyPair.privateKey,
      salt,
    );
    expect(derivedAES.algorithm.name).toBe("AES-GCM");
    expect(derivedAES.extractable).toBeFalsy();
    expect(derivedAES.type).toBe("secret");
    expect(derivedAES.usages).contains("encrypt");
  });
  test("for decryption", async () => {
    const derivedAES = await deriveKey(
      ephemeralKeyPair.publicKey,
      recipientKeyPair.privateKey,
      salt,
    );
    expect(derivedAES.algorithm.name).toBe("AES-GCM");
    expect(derivedAES.extractable).toBeFalsy();
    expect(derivedAES.type).toBe("secret");
    expect(derivedAES.usages).contains("decrypt");
  });

  test("invalid key", async () => {
    const aesKey = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt"],
    );
    await expect(
      deriveKey(ephemeralKeyPair.publicKey, aesKey, salt),
    ).rejects.toThrow(KeyDerivationError);
  });

  // 結合テスト
  test("derived keys are compatible", async () => {
    const encKey = await deriveKey(
      recipientKeyPair.publicKey,
      ephemeralKeyPair.privateKey,
      salt,
    );

    const decKey = await deriveKey(
      ephemeralKeyPair.publicKey,
      recipientKeyPair.privateKey,
      salt,
    );
    const originalMsg = "hello";
    const iv = genIv();
    const plaintext = new TextEncoder().encode(originalMsg);

    const aad = buildChunkAad(new Uint8Array(HEADER_HASH_LENGTH), 0, true);
    const ciphertext = await encrypt(plaintext, encKey, iv, aad);

    const decrypted = await decrypt(ciphertext, decKey, iv, aad);

    expect(new TextDecoder().decode(decrypted)).toBe(originalMsg);
  });
});
