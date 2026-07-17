const downloads = new Map();

// urlのパーセントエンコーディングをやりくりするヘルパー関数
function encodeRFC5987(value) {
  return encodeURIComponent(value)
    .replace(/['()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase())
    .replace(/%(7C|60|5E)/g, (match) => match.toUpperCase());
}
/**
 * ClientからReadableStreamを受け取る
 */
self.addEventListener("message", (event) => {
  const port = event.ports[0];
  const data = event.data;

  if (data?.type !== "register-download") return;

  downloads.set(data.id, {
    stream: data.stream,
    filename: data.filename ?? "encrypted.enc",
    contentType: data.contentType ?? "application/octet-stream",
    port: port,
  });
  port.postMessage({ ok: true });
});
/**
 * ダウンロード要求を横取り
 */
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (!url.pathname.startsWith("/download/")) return;

  const id = url.pathname.substring("/download/".length);

  const download = downloads.get(id);

  if (!download) {
    event.respondWith(
      new Response("Download not found.", {
        status: 404,
        headers: {
          "Content-Type": "text/plain",
        },
      }),
    );
    return;
  }

  const port = download.port;
  downloads.delete(id);
  const stream = download.stream;

  event.respondWith(
    (async () => {
      const reader = stream.getReader();
      const rs = new ReadableStream({
        async pull(controller) {
          try {
            const { done, value } = await reader.read();

            if (done) {
              controller.close();
              return;
            }

            controller.enqueue(value);
          } catch (err) {
            port.postMessage({
              type: "cancel",
            });

            controller.error(err);
          }
        },

        async cancel(reason) {
          port.postMessage({
            type: "cancel",
          });

          try {
            await reader.cancel(reason);
          } catch (err) {
            port.postMessage({
              type: "cancel",
            });

            controller.error(err);
          }
        },
      });

      return new Response(rs, {
        headers: {
          "Content-Type": download.contentType,
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeRFC5987(download.filename)}`,
        },
      });
    })(),
  );
});
