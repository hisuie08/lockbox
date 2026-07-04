<template>
  <input
    type="file"
    :disabled="disabled"
    class="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
import type { useFileDecrypt, useFileEncrypt } from "@/hooks/useFileCryptoStream";
import { computed } from "vue";

const props = defineProps<{
  files: ReturnType<typeof useFileEncrypt> | ReturnType<typeof useFileDecrypt>;
  cryptoKey: CryptoKey | null;
  callback: (maxFileSize: number, event: Event) => void;
}>();

const disabled = computed(
  () =>
    !(
      props.cryptoKey != null &&
      (props.files.progress == 0 ||
        (props.files.progress == 1 && props.files.saved))
    ),
);

function handleChange(event: Event) {
  props.callback(props.files.maxFileSize, event);
}
</script>
