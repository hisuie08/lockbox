const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export function encodeText(value: string): Uint8Array<ArrayBuffer> {
  return textEncoder.encode(value) as Uint8Array<ArrayBuffer>
}

export function decodeText(value: BufferSource): string {
  return textDecoder.decode(value)
}

export function bytesToBase64(bytes: Uint8Array<ArrayBufferLike>): string {
  const chunkSize = 0x8000
  let binary = ""

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  return btoa(binary)
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return bytesToBase64(new Uint8Array(buffer))
}

export function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value.replace(/\s/g, ""))
  const bytes = new Uint8Array(binary.length) as Uint8Array<ArrayBuffer>

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

export function stableJson(value: unknown): string {
  return JSON.stringify(value)
}
