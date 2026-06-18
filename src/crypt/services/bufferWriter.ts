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

  toBlob(type = "application/octet-stream"): Blob {
    return new Blob(this.chunks as BlobPart[], { type });
  }

  toFile(filename: string): File {
    return new File(this.chunks as BlobPart[], filename, {
      type: "application/octet-stream",
    });
  }

  clear(): void {
    this.chunks.length = 0;
  }
}

export function downloadFile(file: File): void {
  const url = URL.createObjectURL(file);

  const a = document.createElement("a");

  a.href = url;
  a.download = file.name;

  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}
