import { describe, expect, it, vi } from "vitest";
import { CancelableWriter } from "./cancelableWriter";

function createWriterMock(): WritableStreamDefaultWriter<Uint8Array> {
  return {
    write: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    abort: vi.fn().mockResolvedValue(undefined),
    releaseLock: vi.fn(),
    desiredSize: 123,
    ready: Promise.resolve(),
    closed: Promise.resolve(),
  } as unknown as WritableStreamDefaultWriter<Uint8Array>;
}

describe("CancelableWriter", () => {
  it("writeは内部writerへ委譲する", async () => {
    const writer = createWriterMock();
    const signal = new AbortController().signal;
    const cancelable = new CancelableWriter(writer, signal);

    const chunk = new Uint8Array([1, 2, 3]);

    await cancelable.write(chunk);

    expect(writer.write).toHaveBeenCalledOnce();
    expect(writer.write).toHaveBeenCalledWith(chunk);
  });

  it("開始前にabortされていたらwriteしない", async () => {
    const writer = createWriterMock();
    const controller = new AbortController();
    controller.abort();

    const cancelable = new CancelableWriter(writer, controller.signal);

    await expect(cancelable.write(new Uint8Array())).rejects.toThrow();

    expect(writer.write).not.toHaveBeenCalled();
  });

  it("write中にabortされたらAbortErrorを優先して投げる", async () => {
    const writer = createWriterMock();
    const controller = new AbortController();

    const originalError = new Error("write failed");

    vi.mocked(writer.write).mockImplementation(async () => {
      controller.abort();
      throw originalError;
    });

    const cancelable = new CancelableWriter(writer, controller.signal);

    await expect(cancelable.write(new Uint8Array())).rejects.toMatchObject({
      name: "AbortError",
    });
  });

  it("abortされていなければwriter.writeのエラーをそのまま投げる", async () => {
    const writer = createWriterMock();
    const signal = new AbortController().signal;

    const error = new Error("write failed");
    vi.mocked(writer.write).mockRejectedValue(error);

    const cancelable = new CancelableWriter(writer, signal);

    await expect(cancelable.write(new Uint8Array())).rejects.toBe(error);
  });

  it("closeは内部writerへ委譲する", async () => {
    const writer = createWriterMock();
    const signal = new AbortController().signal;

    const cancelable = new CancelableWriter(writer, signal);

    await cancelable.close();

    expect(writer.close).toHaveBeenCalledOnce();
  });

  it("開始前にabortされていたらcloseしない", async () => {
    const writer = createWriterMock();

    const controller = new AbortController();
    controller.abort();

    const cancelable = new CancelableWriter(writer, controller.signal);

    await expect(cancelable.close()).rejects.toThrow();

    expect(writer.close).not.toHaveBeenCalled();
  });

  it("abortは内部writerへ委譲する", async () => {
    const writer = createWriterMock();
    const signal = new AbortController().signal;

    const cancelable = new CancelableWriter(writer, signal);

    const reason = new Error("reason");
    await cancelable.abort(reason);

    expect(writer.abort).toHaveBeenCalledOnce();
    expect(writer.abort).toHaveBeenCalledWith(reason);
  });

  it("releaseLockは内部writerへ委譲する", () => {
    const writer = createWriterMock();
    const signal = new AbortController().signal;

    const cancelable = new CancelableWriter(writer, signal);

    cancelable.releaseLock();

    expect(writer.releaseLock).toHaveBeenCalledOnce();
  });

  it("getterは内部writerの値を返す", () => {
    const writer = createWriterMock();
    const signal = new AbortController().signal;

    const cancelable = new CancelableWriter(writer, signal);

    expect(cancelable.desiredSize).toBe(writer.desiredSize);
    expect(cancelable.ready).toBe(writer.ready);
    expect(cancelable.closed).toBe(writer.closed);
  });
});
