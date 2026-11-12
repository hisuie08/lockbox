<script setup lang="ts">
import { computed, inject, type Ref } from "vue";
import { Check, Copy } from "lucide-vue-next";
import { type GeneratedKeyHandle } from "@/composables/useCryptoKeys";
import { keyIsGenerating } from "../provideKeys";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/base/input-group";
import { useClipboard } from "@vueuse/core";
import { toast } from "vue-sonner";

const props = defineProps<{
  genKey: GeneratedKeyHandle;
}>();

const { copied, copy: _copy } = useClipboard();
async function copy() {
  try {
    await _copy(JSON.stringify(props.genKey.jwk.value));
    props.genKey.isSaved.value = true;
    toast.info(`${props.genKey.keyType} key was copied`);
  } catch {
    toast.error("Clipboard permission was blocked.");
  }
}
const isGenerating = inject<Ref<boolean>>(keyIsGenerating);
const inputType = props.genKey.keyType == "private" ? "password" : "text";

const value = computed(() =>
  isGenerating?.value
    ? "Generating..."
    : JSON.stringify(props.genKey.jwk.value),
);

function onFocus(event: FocusEvent) {
  (event.target as HTMLInputElement).select();
}
function onCopy() {
  props.genKey.isSaved.value = true;
}
</script>

<template>
  <label class="grid gap-2">
    <span class="text-sm font-medium"><slot /></span>
    <InputGroup>
      <InputGroupInput
        class="text-ellipsis"
        readonly
        :value="value"
        :type="inputType"
        :disabled="genKey.jwk.value == null || isGenerating"
        @copy="onCopy"
        @focus="onFocus"
      />
      <InputGroupAddon :align="'inline-end'">
        <InputGroupButton
          class="border-0"
          aria-label="Copy"
          title="Copy"
          size="icon-xs"
          @click="copy"
        >
          <Copy v-if="!copied" aria-hidden="true" />
          <Check v-else aria-hidden="true" />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  </label>
</template>
