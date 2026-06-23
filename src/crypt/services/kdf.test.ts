import { beforeAll, describe, expect, test } from "vitest";
import { genKeyPair } from "./keyPair";
import { deriveContentEncryptionKey, KeyDerivationError } from "./kdf";
describe("derive key", () => {
  let recipientKeyPair: CryptoKeyPair;
  let ephemeralKeyPair: CryptoKeyPair;
  const salt: Uint8Array<ArrayBuffer> = crypto.getRandomValues(
    new Uint8Array(32),
  );
  beforeAll(async () => {
    [recipientKeyPair, ephemeralKeyPair] = await Promise.all([
      genKeyPair(),
      genKeyPair(),
    ]);
  });
  test("for encryption", async () => {
    const derivedAES = await deriveContentEncryptionKey(
      recipientKeyPair.publicKey,
      ephemeralKeyPair.privateKey,
      salt,
      "encrypt",
    );
    expect(derivedAES.algorithm.name).toBe("AES-GCM");
    expect(derivedAES.extractable).toBeFalsy();
    expect(derivedAES.type).toBe("secret");
    expect(derivedAES.usages).contains("encrypt");
  });
  test("for decryption", async () => {
    const derivedAES = await deriveContentEncryptionKey(
      ephemeralKeyPair.publicKey,
      recipientKeyPair.privateKey,
      salt,
      "decrypt",
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
      deriveContentEncryptionKey(
        ephemeralKeyPair.publicKey,
        aesKey,
        salt,
        "decrypt",
      ),
    ).rejects.toThrow(KeyDerivationError);
  });

  // 結合テスト
  test("derived keys are compatible", async () => {
    const encKey = await deriveContentEncryptionKey(
      recipientKeyPair.publicKey,
      ephemeralKeyPair.privateKey,
      salt,
      "encrypt",
    );

    const decKey = await deriveContentEncryptionKey(
      ephemeralKeyPair.publicKey,
      recipientKeyPair.privateKey,
      salt,
      "decrypt",
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode("hello");

    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      encKey,
      plaintext,
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      decKey,
      ciphertext,
    );

    expect(new TextDecoder().decode(decrypted)).toBe("hello");
  });
});
