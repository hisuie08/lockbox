import { MemoryWriteError } from "../errors";

// Firefox等 stream非対応ブラウザ用
export class BufferedWriter {
  private readonly chunks: Uint8Array[] = [];

  readonly stream = new WritableStream<Uint8Array>({
    write: (chunk) => {
      try {
        this.chunks.push(chunk);
      } catch (e) {
        throw new MemoryWriteError(
          "メモリ不足のためファイルを書き込めませんでした。ブラウザを再起動するか、より小さいファイルを使用してください。",
          e,
        );
      }
    },
  });

  get size(): number {
    try {
      return this.chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    } catch (e) {
      throw new MemoryWriteError(
        "メモリ不足のためファイルを書き込めませんでした。ブラウザを再起動するか、より小さいファイルを使用してください。",
        e,
      );
    }
  }

  toBlob(type: string): Blob {
    try {
      return new Blob(this.chunks as BlobPart[], { type });
    } catch (e) {
      throw new MemoryWriteError(
        "メモリ不足のためファイルを書き込めませんでした。ブラウザを再起動するか、より小さいファイルを使用してください。",
        e,
      );
    }
  }
  // テスト用
  toFile(filename: string, filetype: string): File {
    return new File(this.chunks as BlobPart[], filename, {
      type: filetype,
    });
  }

  clear(): void {
    this.chunks.length = 0;
  }
}
