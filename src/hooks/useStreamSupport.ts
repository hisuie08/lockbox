export function useStreamSupport(): boolean {
  return typeof window !== "undefined" && "showSaveFilePicker" in window;
}
