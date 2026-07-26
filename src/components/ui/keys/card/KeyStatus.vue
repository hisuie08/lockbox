<script setup lang="ts">
import type { KeyHandle } from "@/composables/useCryptoKeys";

defineProps<{ keyHandle: KeyHandle }>();
</script>
<template>
  <div class="flex w-full items-center space-x-1">
    <div
      class="dot"
      :class="{
        loaded: keyHandle.key.value,
        unset: !keyHandle.key.value,
      }"
    />
    <p class="place-self-stretch place-content-center w-full" @click="">
      {{ keyHandle.keyType == "public" ? "公開鍵" : "秘密鍵" }}
    </p>
  </div>
</template>
<style lang="css" scoped>
.dot {
  width: 0.6em;
  height: 0.6em;
  aspect-ratio: 1;
  border-radius: 50%;
}
.loaded {
  background-color: var(--color-chart-2);
  &.dark {
    background-color: var(--color-chart-1);
  }
}
.unset {
  background-color: var(--color-muted-foreground);
}
</style>
