export function genSalt(): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(32));
}

export function genIv(): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(12));
}
