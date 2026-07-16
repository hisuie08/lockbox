<script setup lang="ts">
import { CardDescription, CardHeader, CardTitle } from "@/components/base/card";
import type { KeyHandle } from "@/composables/useCryptoKeys";
import { useStreamSupport } from "@/composables/useStreamSupport";
import { WARNING_FILE_SIZE } from "@/crypt";
import { formatBytes } from "@/lib/unit";
import { LockKeyhole, UnlockKeyhole } from "lucide-vue-next";

const props = defineProps<{
  keyHandle: KeyHandle;
}>();

const useKey = props.keyHandle.keyType == "public" ? "公開鍵" : "秘密鍵";
const supported = useStreamSupport();
</script>

<template>
  <CardHeader>
    <CardTitle class="flex items-center gap-2">
      <LockKeyhole
        v-if="keyHandle.keyType == 'public'"
        aria-hidden="true"
        class="size-4"
      />
      <UnlockKeyhole v-else aria-hidden="true" class="size-4" />
      <slot />
      <span
        v-if="!supported.isSupported"
        class="ml-auto text-sm font-normal text-muted-foreground"
      >
        推奨ファイルサイズ: {{ formatBytes(WARNING_FILE_SIZE) }}
      </span>
    </CardTitle>
    <CardDescription>
      <strong>{{ useKey }}</strong
      >を使用します
    </CardDescription>
  </CardHeader>
</template>
