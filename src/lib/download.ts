export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadText(contents: string, filename: string) {
  downloadBlob(
    new Blob([contents], {
      type: "application/json",
    }),
    filename,
  );
}
