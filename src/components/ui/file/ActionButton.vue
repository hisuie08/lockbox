<script setup lang="ts">
import type {
  useFileDecrypt,
  useFileEncrypt,
} from "@/composables/useFileCrypto";
import { computed } from "vue";
import { Check, LockKeyhole } from "lucide-vue-next";
import { Button } from "@/components/base/button";
import { Spinner } from "@/components/base/spinner";

const props = defineProps<{
  files: ReturnType<typeof useFileEncrypt> | ReturnType<typeof useFileDecrypt>;
  onClick: () => void;
}>();

const disabled = computed(
  () =>
    !props.files.fileToProcess ||
    !props.files.keyState.key ||
    props.files.progress.value != 0,
);
const label = props.files.keyState.keyType == "public" ? "暗号化" : "復号化";
</script>

<template>
  <Button :disabled="disabled" @click="onClick">
    <LockKeyhole v-if="files.progress.value == 0" aria-hidden="true" />
    <Spinner v-else-if="files.isProcessing.value" aria-hidden="true" />

    <Check v-else aria-hidden="true" />
    {{
      files.progress.value == 0
        ? label + "開始"
        : files.isProcessing.value
          ? label + "中..."
          : "完了"
    }}
  </Button>
</template>
