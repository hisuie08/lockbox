import { BufferedWriter } from "@/crypt/bufferio/bufferWriter";

export type SupportedStreamWriter = {
  writer: WritableStreamDefaultWriter<Uint8Array>;
  buffer?: BufferedWriter;
};
export function useStreamSupport() {
  const isSupported =
    typeof window !== "undefined" && "showSaveFilePicker" in window;
  async function getStreamWriter(
    filename: string,
  ): Promise<SupportedStreamWriter> {
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

  return {
    isSupported,
    getStreamWriter,
  };
}
