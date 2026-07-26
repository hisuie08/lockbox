<script setup lang="ts">
import { Label } from "@/components/base/label";
import type { KeyHandle } from "@/composables/useCryptoKeys";

defineProps<{ keyHandle: KeyHandle }>();
</script>
<template>
  <div class="grid gap-4 p-2 w-full">
    <div class="grid grid-cols-2 items-center gap-1">
      <Label>Key Type</Label>
      <span>{{ keyHandle.keyType }}</span>
    </div>
    <div class="grid grid-cols-2 items-center gap-1">
      <Label>Algorithmn</Label>
      <span>{{ keyHandle.key.value?.algorithm.name }}</span>
    </div>
    <div class="grid grid-cols-2 items-center gap-1">
      <Label>Thumbprint</Label>
      <span class="wrap-break-word">{{ keyHandle.thumbprint.value }}</span>
    </div>
  </div>
</template>
