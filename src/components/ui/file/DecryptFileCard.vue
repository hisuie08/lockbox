<template>
  <div
    data-slot="card"
    data-size="default"
    class="group/card flex flex-col gap-6 overflow-hidden rounded-xl bg-card py-6 text-sm text-card-foreground shadow-xs ring-1 ring-foreground/10 has-[>img:first-child]:pt-0 data-[size=sm]:gap-4 data-[size=sm]:py-4 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl rounded-lg"
  >
    <FileHeader
      use-key="秘密鍵"
      :max-file-size="files.maxFileSize"
      :file-name="files.fileToProcess?.name ?? null"
    >
      <UnlockKeyhole aria-hidden="true" class="size-4" />
      Decrypt
    </FileHeader>
    <div data-slot="card-content" class="px-6 group-data-[size=sm]/card:px-4 grid gap-4">
      <div
        v-if="files.error"
        class="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {{ files.error }}
      </div>
      <FileInput
        :files="files"
        :crypto-key="keys.privateKey"
        :callback="onFileChange"
      />
      <div
        v-if="files.fileToProcess && files.originFile"
        class="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm"
      >
        <span class="truncate">{{ files.fileToProcess.name }}</span>
        <span class="shrink-0 text-muted-foreground">
          {{ formatBytes(files.originFile.originalSize) }}
        </span>
        <span>{{ files.originFile?.originalName }}</span>
      </div>
      <div v-if="files.fileToProcess" data-slot="progress" class="flex flex-wrap gap-3">
        <div data-slot="progress-value" class="ml-auto text-sm text-muted-foreground tabular-nums">
          {{ Math.round(files.progress * 100) }}%
        </div>
        <div
          data-slot="progress-track"
          class="relative flex h-1.5 w-full items-center overflow-x-hidden rounded-full bg-muted"
        >
          <div
            data-slot="progress-indicator"
            class="h-full bg-primary transition-all"
            :style="{ width: `${files.progress * 100}%` }"
          />
        </div>
      </div>
      <ActionButton
        :files="files"
        :crypto-key="keys.privateKey"
        :on-click="() => files.decryptSelectedFile(keys.privateKey)"
        label="復号化"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { useCryptoKeys } from "@/hooks/useCryptoKeys";
import type { useFileDecrypt } from "@/hooks/useFileCryptoStream";
import { formatBytes } from "@/lib/unit";
import { UnlockKeyhole } from "lucide-vue-next";
import ActionButton from "./ActionButton.vue";
import FileHeader from "./Header.vue";
import FileInput from "./FileInput.vue";

const props = defineProps<{
  files: ReturnType<typeof useFileDecrypt>;
  keys: ReturnType<typeof useCryptoKeys>;
}>();

function onFileChange(_: number, event: Event) {
  props.files.setFileToDecrypt(event as never);
  (event.target as HTMLInputElement).value = "";
}
</script>
