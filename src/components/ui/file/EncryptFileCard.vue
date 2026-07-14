<script setup lang="ts">
import type { KeyHandle } from "@/composables/useCryptoKeys.ts";
import type { useFileEncrypt } from "@/composables/useFileCrypto";
import { formatBytes } from "@/lib/unit";
import ActionButton from "./ActionButton.vue";
import FileHeader from "./Header.vue";
import FileInput from "./FileInput.vue";
import { Card, CardContent } from "@/components/base/card";
import FileIndicator from "./FileIndicator.vue";

const props = defineProps<{
  files: ReturnType<typeof useFileEncrypt>;
  keyHandle: KeyHandle;
}>();

function onFileChange(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  if (files != null) {
    props.files.setFile(files[0]);
  }
  (event.target as HTMLInputElement).value = "";
}
</script>

<template>
  <Card class="rounded-lg">
    <FileHeader :key-handle="keyHandle"> Encrypt </FileHeader>

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
        v-if="files.fileToProcess.value"
        class="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm whitespace-nowrap overflow-hidden text-ellipsis w-full"
      >
        <span class="whitespace-nowrap overflow-hidden text-ellipsis">{{
          files.fileToProcess.value.name ?? "AAAAAAAAAAAAAAAAAAAAAAAA"
        }}</span>
        <span class="ml-3 shrink-0 text-muted-foreground">
          {{ formatBytes(files.fileToProcess.value.size) }}
        </span>
      </div>
      <FileIndicator
        v-if="props.files.fileToProcess.value"
        :progress="props.files.progress.value"
      />

      <ActionButton
        :files="files"
        :crypto-key="keyHandle.key.value"
        :on-click="() => files.encryptSelectedFile(keyHandle.key.value)"
        label="暗号化"
      />
    </CardContent>
  </Card>
</template>
