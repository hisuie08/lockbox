export type X25519KeyAlgorithm = { name: "X25519" };
export type X25519KeyPairGenParam = ReadonlyArray<
  Extract<KeyUsage, "deriveBits">
>;

export const X25519: {
  algorithm: X25519KeyAlgorithm;
  usage: X25519KeyPairGenParam;
} = {
  algorithm: { name: "X25519" },
  usage: ["deriveBits"],
} as const;

export const AES: {
  algorithm: AesKeyAlgorithm & { readable: string };
  usage: ReadonlyArray<KeyUsage>;
} = {
  algorithm: { name: "AES-GCM", length: 256, readable: "AES-256-GCM" },
  usage: ["encrypt", "decrypt"],
} as const;

export const HKDF: {
  algorithm: HmacImportParams & { readable: string };
  usage: ReadonlyArray<KeyUsage>;
  keyInfo: string;
} = {
  algorithm: { name: "HKDF", hash: "SHA-256", readable: "SHA256" },
  usage: ["deriveKey"],
  keyInfo: "file-encryption-v1",
} as const;
