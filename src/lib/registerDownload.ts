export interface RegisterDownloadOptions {
  stream: ReadableStream<Uint8Array>;
  filename: string;
  contentType?: string;
}

export async function registerDownload({
  stream,
  filename,
  contentType = "application/octet-stream",
}: RegisterDownloadOptions): Promise<{
  url: string;
  signal: AbortSignal;
}> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Worker is not supported.");
  }
  const channel = new MessageChannel();
  const port = channel.port1;
  const registration = await navigator.serviceWorker.ready;

  if (!registration.active) {
    throw new Error("Service Worker is not active.");
  }

  const id = crypto.randomUUID();

  const controller = new AbortController();
  let registerResolve!: () => void;
  const registered = new Promise<void>((resolve) => {
    registerResolve = resolve;
  });

  port.onmessage = (event) => {
    switch (event.data.type) {
      case "registered":
        registerResolve();
        break;
      case "cancel":
        controller.abort();
        break;
    }
  };

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

  await registered;
  return {
    url: `${import.meta.env.BASE_URL}download/${id}`,
    signal: controller.signal,
  };
}
