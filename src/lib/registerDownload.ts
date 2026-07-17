export interface RegisterDownloadOptions {
  stream: ReadableStream<Uint8Array>;
  filename: string;
  contentType?: string;
}

export async function registerDownload({
  stream,
  filename,
  contentType = "application/octet-stream",
}: RegisterDownloadOptions): Promise<{ url: string; signal: AbortSignal }> {
  if (!("serviceWorker" in navigator))
    throw new Error("Service Worker is not supported.");
  const channel = new MessageChannel();
  const port = channel.port1;
  const registration = await navigator.serviceWorker.ready;

  if (!registration.active) throw new Error("Service Worker is not active.");

  const id = crypto.randomUUID();

  const controller = new AbortController();
  registration.active.postMessage(
    {
      type: "register-download",
      id,
      filename,
      contentType,
      stream,
    },
    [stream, channel.port2],
  );
  await new Promise<void>((resolve, reject) => {
    port.onmessage = (e) => {
      if (e.data.ok) resolve();
      else reject(new Error("failed to register download"));
    };
  });

  port.onmessage = (event) => {
    if (event.data.type === "cancel") {
      controller.abort();
    }
  };

  return {
    url: `/download/${id}`,
    signal: controller.signal,
  };
}
