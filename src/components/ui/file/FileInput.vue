<script setup lang="ts">
import { Input } from "@/components/base/input";
import type {
  useFileDecrypt,
  useFileEncrypt,
} from "@/composables/useFileCrypto";
import { computed } from "vue";

const props = defineProps<{
  files: ReturnType<typeof useFileEncrypt> | ReturnType<typeof useFileDecrypt>;
  callback: (event: Event) => void;
}>();

const disabled = computed(
  () =>
    !(
      props.files.keyState.key != null &&
      (props.files.progress.value == 0 || props.files.progress.value == 1)
    ),
);

function handleChange(event: Event) {
  props.callback(event);
}
</script>

<template>
  <Input type="file" :disabled="disabled" @change="handleChange" />
</template>
