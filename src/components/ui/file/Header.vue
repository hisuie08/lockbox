<script setup lang="ts">
import { CardHeader } from "@/components/base/card";
import type { KeyHandle } from "@/composables/useCryptoKeys";
import { useStreamSupport } from "@/composables/useStreamSupport";
import { formatBytes } from "@/lib/unit";
import { LockKeyhole } from "lucide-vue-next";

const props = defineProps<{
  keyHandle: KeyHandle;
  maxFileSize: number;
}>();

const useKey = props.keyHandle.keyType == "public" ? "公開鍵" : "秘密鍵";
const supported = useStreamSupport();
</script>

<template>
  <CardHeader>
    <CardTitle class="flex items-center gap-2">
      <LockKeyhole aria-hidden="true" class="size-4" />
      <slot />
      <span
        v-if="!supported.isSupported"
        class="ml-auto text-sm font-normal text-muted-foreground"
      >
        Max file size: {{ formatBytes(maxFileSize) }}
      </span>
    </CardTitle>
    <CardDescription>
      <strong>{{ useKey }}</strong
      >を使用します
    </CardDescription>
  </CardHeader>
</template>
