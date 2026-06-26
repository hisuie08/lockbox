export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadText(contents: string, filename: string) {
  downloadBlob(
    new Blob([contents], {
      type: "application/json",
    }),
    filename,
  );
}
