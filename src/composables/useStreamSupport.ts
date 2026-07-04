import { BufferedWriter } from "@/crypt/bufferio/bufferWriter";

type SupportedStreamWriter = {
  writer: WritableStreamDefaultWriter<Uint8Array>;
  buffer?: BufferedWriter;
};

const isSupported =
  typeof window !== "undefined" && "showSaveFilePicker" in window;

async function getStreamWriter(
  filename: string,
): Promise<SupportedStreamWriter> {
  if (isSupported) {
    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
    });

    const writable = await handle.createWritable();

    return {
      writer: writable.getWriter(),
    };
  }

  const buffer = new BufferedWriter();

  return {
    writer: buffer.stream.getWriter(),
    buffer,
  };
}

export function useStreamSupport() {
  return {
    isSupported,
    getStreamWriter,
  };
}
