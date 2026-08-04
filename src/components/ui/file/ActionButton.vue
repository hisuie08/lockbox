<script setup lang="ts">
import type {
  useFileDecrypt,
  useFileEncrypt,
} from "@/composables/useFileCrypto";
import { computed } from "vue";
import { Check, LockKeyhole, LockKeyholeOpen } from "lucide-vue-next";
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
    <div v-if="files.progress.value == 0">
      <LockKeyhole
        v-if="files.keyState.keyType == 'public'"
        aria-hidden="true"
      />
      <LockKeyholeOpen v-else />
    </div>
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
