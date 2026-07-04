<template>
  <div
    data-slot="card-header"
    class="group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-6 group-data-[size=sm]/card:px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-6 group-data-[size=sm]/card:[.border-b]:pb-4"
  >
    <div
      data-slot="card-title"
      class="text-base leading-normal font-medium group-data-[size=sm]/card:text-sm flex items-center gap-2"
    >
      <slot />
      <span v-if="!supported" class="ml-auto text-sm font-normal text-muted-foreground">
        Max file size: {{ formatBytes(maxFileSize) }}
      </span>
    </div>
    <div data-slot="card-description" class="text-sm text-muted-foreground">
      <strong>{{ useKey }}</strong>を使用します
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStreamSupport } from "@/hooks/useStreamSupport";
import { formatBytes } from "@/lib/unit";

defineProps<{
  maxFileSize: number;
  fileName: string | null;
  useKey: string;
}>();

const supported = useStreamSupport();
</script>
