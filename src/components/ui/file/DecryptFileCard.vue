<script setup lang="ts">
import { useFileDecrypt } from "@/composables/useFileCrypto";
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

const dec = useFileDecrypt(props.keyState);
function onFileChange(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  if (files != null) {
    dec.setFile(files[0]);
  }
}
</script>

<template>
  <Card class="rounded-lg">
    <FileHeader :keyState="keyState"> Decrypt </FileHeader>
    <CardContent class="grid gap-4">
      <div
        v-if="dec.error.value"
        class="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {{ dec.error.value }}
      </div>
      <FileInput :files="dec" :callback="onFileChange" />
      <div
        v-if="dec.fileToProcess.value && dec.originFile.value"
        class="rounded-md bg-muted px-3 py-2 text-sm whitespace-nowrap overflow-hidden text-ellipsis w-full"
      >
        <div class="flex items-center justify-between">
          <span class="whitespace-nowrap overflow-hidden text-ellipsis">
            {{ dec.originFile.value.originalName }}</span
          >
          <span class="ml-3 shrink-0 text-muted-foreground">
            {{ formatBytes(dec.fileToProcess.value.size) }}
          </span>
        </div>
      </div>
      <FileIndicator
        v-if="dec.fileToProcess.value"
        :progress="dec.progress.value"
      />
      <ActionButton
        :files="dec"
        :on-click="() => dec.decryptSelectedFile(dec.keyState.key.value)"
      />
    </CardContent>
  </Card>
</template>
