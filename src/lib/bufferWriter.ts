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

  toBlob(type: string): Blob {
    return new Blob(this.chunks as BlobPart[], { type });
  }

  toFile(filename: string, filetype: string): File {
    return new File(this.chunks as BlobPart[], filename, {
      type: filetype,
    });
  }

  clear(): void {
    this.chunks.length = 0;
  }
}
