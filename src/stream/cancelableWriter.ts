// AbortSignalで書き込みを中断できるwriter
export class CancelableWriter implements WritableStreamDefaultWriter {
  private readonly writer: WritableStreamDefaultWriter<Uint8Array>;
  private readonly signal: AbortSignal;
  constructor(
    writer: WritableStreamDefaultWriter<Uint8Array>,
    signal: AbortSignal,
  ) {
    this.writer = writer;
    this.signal = signal;
  }

  async write(chunk: Uint8Array): Promise<void> {
    this.signal.throwIfAborted();
    try {
      await this.writer.write(chunk);
    } catch (err) {
      this.signal.throwIfAborted();
      throw err;
    }
  }

  async close(): Promise<void> {
    this.signal.throwIfAborted();
    await this.writer.close();
  }

  async abort(reason?: unknown): Promise<void> {
    await this.writer.abort(reason);
  }

  releaseLock(): void {
    this.writer.releaseLock();
  }

  get desiredSize() {
    return this.writer.desiredSize;
  }

  get ready() {
    return this.writer.ready;
  }

  get closed() {
    return this.writer.closed;
  }
}
