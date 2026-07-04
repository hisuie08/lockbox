<template>
  <button
    :disabled="disabled"
    class="group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 bg-primary text-primary-foreground hover:bg-primary/80 h-9 gap-1.5 px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2"
    @click="onClick"
  >
    <LockKeyhole v-if="files.progress == 0" aria-hidden="true" />
    <Loader2Icon
      v-else-if="files.isProcessing || !files.saved"
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      class="size-4 animate-spin"
      aria-hidden="true"
    />
    <Check v-else aria-hidden="true" />
    {{
      files.progress == 0
        ? label + "開始"
        : files.isProcessing
          ? label + "中..."
          : !files.saved
            ? "保存中..."
            : "完了"
    }}
  </button>
</template>

<script setup lang="ts">
import type { useFileDecrypt, useFileEncrypt } from "@/hooks/useFileCryptoStream";
import { computed } from "vue";
import { Check, Loader2Icon, LockKeyhole } from "lucide-vue-next";

const props = defineProps<{
  files: ReturnType<typeof useFileEncrypt> | ReturnType<typeof useFileDecrypt>;
  cryptoKey: CryptoKey | null;
  onClick: () => void;
  label: string;
}>();

const disabled = computed(
  () =>
    !props.files.fileToProcess ||
    !props.cryptoKey ||
    props.files.progress != 0,
);
</script>
