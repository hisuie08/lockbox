import { DEFAULT_CHUNK_SIZE } from "../constants";
import { InputReadError } from "../errors";

export interface ChunkReader {
  readChunk(): Promise<Uint8Array | null>;
}

export class StreamChunkReader implements ChunkReader {
  private readonly reader: ReadableStreamDefaultReader<Uint8Array>;
  // reader.read()は勝手なサイズで返してくる
  // そこでストリームをチャンクサイズに合わせて自分で切りそろえる
  // チャンク境界をまたぐ端数データを保持する
  private pending = new Uint8Array(0);
  private done = false;
  private readonly chunkSize: number;
  constructor(
    source: ReadableStream<Uint8Array>,
    chunkSize = DEFAULT_CHUNK_SIZE,
  ) {
    this.reader = source.getReader();
    this.chunkSize = chunkSize;
  }

  async readChunk(): Promise<Uint8Array | null> {
    // 入力ストリームを順次読み込み
    while (this.pending.length < this.chunkSize && !this.done) {
      let result;
      try {
        result = await this.reader.read();
      } catch (error) {
        throw new InputReadError("Failed to read input file.", error);
      }

      if (result.done) {
        this.done = true;
        break;
      }
      // 前回の端数と今回読み込んだデータを結合する
      const merged = new Uint8Array(this.pending.length + result.value.length);
      merged.set(this.pending);
      merged.set(result.value, this.pending.length);
      this.pending = merged;
    }

    // ストリームが終わり、端数も無ければ終了
    if (this.done && this.pending.length === 0) {
      return null;
    }

    // 最終チャンク（chunkSize未満）
    if (this.done && this.pending.length <= this.chunkSize) {
      const chunk = this.pending;
      this.pending = new Uint8Array(0);
      return chunk;
    }

    // 通常チャンク
    const chunk = this.pending.slice(0, this.chunkSize);
    this.pending = this.pending.slice(this.chunkSize);
    return chunk;
  }
}

export class ArrayBufferChunkReader implements ChunkReader {
  private offset = 0;
  private readonly bytes: Uint8Array;
  private readonly chunkSize: number;
  constructor(bytes: Uint8Array, chunkSize = DEFAULT_CHUNK_SIZE) {
    this.bytes = bytes;
    this.chunkSize = chunkSize;
  }

  async readChunk(): Promise<Uint8Array | null> {
    if (this.offset >= this.bytes.length) return null;

    const chunk = this.bytes.subarray(
      this.offset,
      this.offset + this.chunkSize,
    );

    this.offset += chunk.length;
    return chunk;
  }
}