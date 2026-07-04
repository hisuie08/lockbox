<script setup lang="ts">
import { CardHeader } from "@/components/base/card";
import { useStreamSupport } from "@/composables/useStreamSupport";
import { formatBytes } from "@/lib/unit";

defineProps<{
  maxFileSize: number;
  fileName: string | null;
  useKey: string;
}>();

const supported = useStreamSupport();
</script>

<template>
  <CardHeader>
    <CardTitle class="flex items-center gap-2">
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
