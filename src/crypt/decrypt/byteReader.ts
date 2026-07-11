import { InputReadError } from "../errors";
export class UnexpectedEofError extends InputReadError {
  constructor() {
    super("Unexpected end of file.");
  }
}
export interface ByteReader {
  readBytes(length: number): Promise<Uint8Array>;
  tryReadBytes(length: number): Promise<Uint8Array | null>;
}

export class StreamBufferedReader implements ByteReader {
  private readonly reader: ReadableStreamDefaultReader<Uint8Array>;

  private buffer = new Uint8Array(0);

  constructor(reader: ReadableStream<Uint8Array>) {
    this.reader = reader.getReader();
  }
  private async read(length: number, asTry: false): Promise<Uint8Array>;
  private async read(length: number, asTry: true): Promise<Uint8Array | null>;

  private async read(
    length: number,
    asTry: boolean,
  ): Promise<Uint8Array | null> {
    while (this.buffer.length < length) {
      let result;

      try {
        result = await this.reader.read();
      } catch (error) {
        throw new InputReadError("Failed to read file.", error);
      }

      const { done, value } = result;

      if (done) {
        if (asTry && this.buffer.length === 0) {
          return null;
        }

        throw new UnexpectedEofError();
      }

      const merged = new Uint8Array(this.buffer.length + value.length);

      merged.set(this.buffer);
      merged.set(value, this.buffer.length);

      this.buffer = merged;
    }

    const result = this.buffer.slice(0, length);
    this.buffer = this.buffer.slice(length);

    return result;
  }

  async readBytes(length: number): Promise<Uint8Array> {
    return this.read(length, false);
  }

  async tryReadBytes(length: number): Promise<Uint8Array | null> {
    return this.read(length, true);
  }
}

export class ArrayBufferByteReader implements ByteReader {
  private offset = 0;
  private readonly bytes: Uint8Array;
  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
  }

  private read(length: number, asTry: false): Uint8Array;
  private read(length: number, asTry: true): Uint8Array | null;
  private read(length: number, asTry: boolean): Uint8Array | null {
    const remaining = this.bytes.length - this.offset;

    if (remaining < length) {
      if (asTry && remaining === 0) {
        return null;
      }
      throw new UnexpectedEofError();
    }

    const result = this.bytes.subarray(this.offset, this.offset + length);

    this.offset += length;

    return result;
  }

  async readBytes(length: number): Promise<Uint8Array> {
    return this.read(length, false);
  }

  async tryReadBytes(length: number): Promise<Uint8Array | null> {
    return this.read(length, true);
  }
}
