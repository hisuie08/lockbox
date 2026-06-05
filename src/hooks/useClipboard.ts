import { useState } from "react";
import { toast } from "sonner";

async function copyText(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error("Clipboard permission was blocked.");
  }
}

export function useCopyText() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (value: string, label: string) => {
    await copyText(value, label);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return { copied, copy };
}
