export function genSalt() {
  return crypto.getRandomValues(new Uint8Array(32));
}

export function genIv() {
  return crypto.getRandomValues(new Uint8Array(12));
}
