import { BufferedWriter } from "@/crypt/bufferio/bufferWriter";

export function useStreamSupport(): boolean {
  return typeof window !== "undefined" && "showSaveFilePicker" in window;
}

export async function getSupportedStreamWriter(filename: string): Promise<{
  writer: WritableStreamDefaultWriter<Uint8Array>;
  buffer?: BufferedWriter;
}> {
  if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
    const writer = (
      await (
        await window.showSaveFilePicker({
          suggestedName: filename,
        })
      ).createWritable()
    ).getWriter();
    return { writer: writer };
  } else {
    const writer = new BufferedWriter();
    return { writer: writer.stream.getWriter(), buffer: writer };
  }
}
