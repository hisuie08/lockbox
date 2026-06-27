const BASE64URL_REGEX = /^[A-Za-z0-9_-]+$/;

export function isBase64Url(value: unknown): value is string {
  return (
    typeof value === "string" && value.length > 0 && BASE64URL_REGEX.test(value)
  );
}

export function uint32ToBytes(value: number): Uint8Array {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);

  view.setUint32(0, value, false);

  return new Uint8Array(buffer);
}

export function bytesToBase64Url(bytes: Uint8Array<ArrayBufferLike>): string {
  // btoa用のバイナリ文字列へ変換。
  // fromCharCodeの引数数制限回避のためチャンク化。
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  return bytesToBase64Url(new Uint8Array(buffer));
}

export function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);

  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/") + padding;

  const binary = atob(base64);

  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}
