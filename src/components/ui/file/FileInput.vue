<script setup lang="ts">
import { Input } from "@/components/base/input";
import type {
  useFileDecrypt,
  useFileEncrypt,
} from "@/composables/useFileCryptoStream";
import { computed } from "vue";

const props = defineProps<{
  files: ReturnType<typeof useFileEncrypt> | ReturnType<typeof useFileDecrypt>;
  cryptoKey: CryptoKey | null;
  callback: (maxFileSize: number, event: Event) => void;
}>();

const disabled = computed(
  () =>
    !(
      props.cryptoKey != null &&
      (props.files.progress.value == 0 ||
        (props.files.progress.value == 1 && props.files.saved))
    ),
);

function handleChange(event: Event) {
  props.callback(props.files.maxFileSize, event);
}
</script>

<template>
  <Input type="file" :disabled="disabled" @change="handleChange" />
</template>
