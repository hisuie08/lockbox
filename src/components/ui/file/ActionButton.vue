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
}>();

const disabled = computed(
  () =>
    !props.files.fileToProcess ||
    !props.files.keyState.key.value ||
    props.files.progress.value == 1,
);
async function onClick() {
  if (props.files.isProcessing.value) {
    props.files.cancel();
  } else {
    if ("encryptSelectedFile" in props.files) {
      await props.files.encryptSelectedFile();
    }
    if ("decryptSelectedFile" in props.files) {
      await props.files.decryptSelectedFile();
    }
  }
}
const label = props.files.keyState.keyType == "public" ? "暗号化" : "復号化";
</script>

<template>
  <Button :disabled="disabled" @click="onClick">
    <LockKeyhole v-if="files.progress.value == 0" aria-hidden="true" />
    <Spinner v-else-if="files.isProcessing.value" aria-hidden="true" />
    <Check v-else aria-hidden="true" />
    {{
      files.progress.value == 0
        ? label
        : files.isProcessing.value
          ? "キャンセル"
          : "完了"
    }}
  </Button>
</template>
