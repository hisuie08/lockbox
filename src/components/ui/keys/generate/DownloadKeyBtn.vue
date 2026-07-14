<script setup lang="ts">
import { Download } from "lucide-vue-next";
import { computed, inject, type Ref } from "vue";
import { keyIsGenerating } from "../provideKeys";
import { Button } from "@/components/base/button";
import type { GeneratedKeyHandle } from "@/composables/useKeyGeneration";

const props = defineProps<{
  genKey: GeneratedKeyHandle;
}>();
const keyText = computed(() => JSON.stringify(props.genKey.jwk.value));
const isGenerating = inject<Ref<boolean>>(keyIsGenerating);
</script>
<template>
  <Button
    variant="outline"
    :disabled="keyText === null || isGenerating"
    @click="genKey.download"
  >
    <Download aria-hidden="true" />
    <slot />
  </Button>
</template>
