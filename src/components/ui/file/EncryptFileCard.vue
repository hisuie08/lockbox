<script setup lang="ts">
import { useFileEncrypt } from "@/composables/useFileCrypto";
import { formatBytes } from "@/lib/unit";
import ActionButton from "./ActionButton.vue";
import FileHeader from "./Header.vue";
import FileInput from "./FileInput.vue";
import { Card, CardContent } from "@/components/base/card";
import FileIndicator from "./FileIndicator.vue";
import type { KeyState } from "@/composables/useKeyState.ts";

const props = defineProps<{
  keyState: KeyState;
}>();
const enc = useFileEncrypt(props.keyState);
function onFileChange(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  if (files != null) {
    enc.setFile(files[0]);
  }
}
</script>

<template>
  <Card class="rounded-lg">
    <FileHeader :keyState="enc.keyState"> Encrypt </FileHeader>

    <CardContent class="grid gap-4">
      <div
        v-if="enc.error.value"
        class="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {{ enc.error.value }}
      </div>
      <FileInput :files="enc" :callback="onFileChange" />
      <div
        v-if="enc.fileToProcess.value"
        class="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm whitespace-nowrap overflow-hidden text-ellipsis w-full"
      >
        <span class="whitespace-nowrap overflow-hidden text-ellipsis">{{
          enc.fileToProcess.value.name ?? "AAAAAAAAAAAAAAAAAAAAAAAA"
        }}</span>
        <span class="ml-3 shrink-0 text-muted-foreground">
          {{ formatBytes(enc.fileToProcess.value.size) }}
        </span>
      </div>
      <FileIndicator
        v-if="enc.fileToProcess.value"
        :progress="enc.progress.value"
      />

      <ActionButton :files="enc" />
    </CardContent>
  </Card>
</template>
