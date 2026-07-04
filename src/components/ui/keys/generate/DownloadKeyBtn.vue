<script setup lang="ts">
import { downloadText } from "@/lib/download";
import { Download } from "lucide-vue-next";
import { inject, type Ref } from "vue";
import { keyIsGenerating } from "../provideKeys";
import { Button } from "@/components/base/button";
import type { useKeyGeneration } from "@/composables/useKeyGeneration";

const props = defineProps<{
  genKey: ReturnType<typeof useKeyGeneration>;
  keyText: string;
  fileName: string;
  callbackSaved: () => void;
}>();

const isGenerating = inject<Ref<boolean>>(keyIsGenerating);

function download() {
  downloadText(props.keyText, props.fileName);
  props.callbackSaved();
}
</script>
<template>
  <Button
    variant="outline"
    :disabled="keyText === null || isGenerating"
    @click="download"
  >
    <Download aria-hidden="true" />
    <slot />
  </Button>
</template>
