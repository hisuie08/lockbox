<script setup lang="ts">
import { computed, inject, type Ref } from "vue";
import { Check, Copy } from "lucide-vue-next";
import type { useKeyGeneration } from "@/composables/useKeyGeneration";
import { keyIsGenerating } from "../provideKeys";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/base/input-group";

const props = defineProps<{
  genKey: ReturnType<typeof useKeyGeneration>;
}>();

const isGenerating = inject<Ref<boolean>>(keyIsGenerating);
const inputType = props.genKey.isPrivate ? "password" : "text";
const value = computed(() =>
  isGenerating?.value
    ? "Generating..."
    : JSON.stringify(props.genKey.jwk.value),
);

async function copyKey() {
  await props.genKey.copy();
}
function onFocus(event: FocusEvent) {
  (event.target as HTMLInputElement).select();
}
function onCopy() {
  props.genKey.setSaved();
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
          @click="copyKey"
        >
          <Copy v-if="!props.genKey.copied.value" aria-hidden="true" />
          <Check v-else aria-hidden="true" />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  </label>
</template>
