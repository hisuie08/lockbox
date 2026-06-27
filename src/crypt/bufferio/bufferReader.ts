import { InputReadError } from "../errors";
export class UnexpectedEofError extends InputReadError {
  constructor() {
    super("Unexpected end of file.");
  }
}
export class BufferedReader {
  private readonly reader: ReadableStreamDefaultReader<Uint8Array>;

  private buffer = new Uint8Array(0);

  constructor(reader: ReadableStreamDefaultReader<Uint8Array>) {
    this.reader = reader;
  }
  async readBytes(length: number): Promise<Uint8Array> {
    while (this.buffer.length < length) {
      let result;

      try {
        result = await this.reader.read();
      } catch (error) {
        throw new InputReadError("Failed to read file.", error);
      }

      const { done, value } = result;

      if (done) {
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
  async tryReadBytes(length: number): Promise<Uint8Array | null> {
    while (this.buffer.length < length) {
      let result;

      try {
        result = await this.reader.read();
      } catch (error) {
        throw new InputReadError("Failed to read input file.", error);
      }

      const { done, value } = result;

      if (done) {
        if (this.buffer.length === 0) {
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
}