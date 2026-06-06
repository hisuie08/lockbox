import { useState } from "react";

export function useDialog() {
  const [isOpen, setOpen] = useState(false);
  return { isOpen, setOpen };
}
