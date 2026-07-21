<script setup lang="ts">
import type { useFileDecrypt } from "@/composables/useFileCrypto";
import { formatBytes } from "@/lib/unit";
import ActionButton from "./ActionButton.vue";
import FileHeader from "./Header.vue";
import FileInput from "./FileInput.vue";
import { Card, CardContent } from "@/components/base/card";
import FileIndicator from "./FileIndicator.vue";
import type { KeyHandle } from "@/composables/useCryptoKeys.ts";

const props = defineProps<{
  files: ReturnType<typeof useFileDecrypt>;
  keyHandle: KeyHandle;
}>();

function onFileChange(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  if (files != null) {
    props.files.setFile(files[0]);
  }
}
</script>

<template>
  <Card class="rounded-lg">
    <FileHeader :keyState="keyHandle"> Decrypt </FileHeader>
    <CardContent class="grid gap-4">
      <div
        v-if="files.error.value"
        class="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {{ files.error.value }}
      </div>
      <FileInput
        :files="files"
        :crypto-key="keyHandle.key.value"
        :callback="onFileChange"
      />
      <div
        v-if="files.fileToProcess.value && files.originFile.value"
        class="rounded-md bg-muted px-3 py-2 text-sm whitespace-nowrap overflow-hidden text-ellipsis w-full"
      >
        <div class="flex items-center justify-between">
          <span class="whitespace-nowrap overflow-hidden text-ellipsis">
            {{ files.originFile.value.originalName }}</span
          >
          <span class="ml-3 shrink-0 text-muted-foreground">
            {{ formatBytes(files.fileToProcess.value.size) }}
          </span>
        </div>
      </div>
      <FileIndicator
        v-if="props.files.fileToProcess.value"
        :progress="props.files.progress.value"
      />
      <ActionButton
        :files="files"
        :on-click="() => files.decryptSelectedFile(keyHandle.key.value)"
      />
    </CardContent>
  </Card>
</template>
