<template>
  <button
    :disabled="!keyText || isGenerating"
    class="group/button inline-flex shrink-0 items-center justify-center rounded-md border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 border-border bg-background shadow-xs hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50 h-9 gap-1.5 px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2"
    @click="download"
  >
    <Download aria-hidden="true" />
    秘密鍵をダウンロード
  </button>
</template>

<script setup lang="ts">
import { downloadText } from "@/lib/download";
import { Download } from "lucide-vue-next";

const props = defineProps<{
  keyText: string;
  isGenerating: boolean;
  callbackSaved: (_: boolean) => void;
}>();

function download() {
  downloadText(props.keyText, "lockbox-private-key.jwk.json");
  props.callbackSaved(true);
}
</script>
