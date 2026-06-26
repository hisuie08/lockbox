import { ENCRYPTED_FILE_MIMETYPE } from "./constants";

// Firefox等 stream非対応ブラウザ用
export class BufferWriter {
  private readonly chunks: Uint8Array[] = [];

  readonly stream = new WritableStream<Uint8Array>({
    write: (chunk) => {
      this.chunks.push(chunk);
    },
  });

  get size(): number {
    return this.chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  }

  toBlob(type = ENCRYPTED_FILE_MIMETYPE): Blob {
    return new Blob(this.chunks as BlobPart[], { type });
  }

  toFile(filename: string): File {
    return new File(this.chunks as BlobPart[], filename, {
      type: ENCRYPTED_FILE_MIMETYPE,
    });
  }

  clear(): void {
    this.chunks.length = 0;
  }
}
