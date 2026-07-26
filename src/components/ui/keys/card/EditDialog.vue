<script setup lang="ts">
import { Checkbox } from "@/components/base/checkbox";
import { Field } from "@/components/base/field";
import { Label } from "@/components/base/label";
import { RadioGroup, RadioGroupItem } from "@/components/base/radio-group";
import { useKeyLoad } from "@/composables/useKeyLoad";
import { ref } from "vue";
import ErrorView from "../../alerts/ErrorView.vue";
import { Input } from "@/components/base/input";
import { Textarea } from "@/components/base/textarea";
import { Button } from "@/components/base/button";
import { DialogClose, DialogTitle } from "@/components/base/dialog";
import type { KeyHandle } from "@/composables/useCryptoKeys.ts";
import { Check } from "lucide-vue-next";
const props = defineProps<{
  keyHandle: KeyHandle;
}>();
const { jwk, loadKeyFile, loadKeyString, errors } = useKeyLoad();
const method = ref<"file" | "paste">("file");
const checked = ref<boolean>(true);
function onChangeString(event: Event) {
  const text = (event.target as HTMLTextAreaElement).value;
  loadKeyString(text);
}
function onChangeFile(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  if (files && files.length > 0) {
    loadKeyFile(files[0]);
  }
}
function onSubmit() {
  props.keyHandle.importJwk(
    jwk.value?.jwk!,
    jwk.value?.keyType!,
    jwk.value?.keyType == "private" && checked.value,
  );
}
</script>
<template>
  <DialogTitle>鍵をインポート</DialogTitle>
  <div class="grid gap-3">
    <RadioGroup v-model="method" class="w-fit">
      <div class="flex items-center gap-3">
        <RadioGroupItem value="file" id="r1" />
        <Label for="r1">鍵ファイルをアップロード</Label>
      </div>
      <div class="flex items-center gap-3 w-fit">
        <RadioGroupItem value="paste" id="r2" />
        <Label for="r2">テキストとして貼り付け</Label>
      </div>
    </RadioGroup>
    <div>
      <ErrorView v-if="errors" :errors="errors" />

      <Input v-if="method === 'file'" type="file" @change="onChangeFile" />
      <Textarea
        class="max-h-30 box-border w-full break-all"
        v-if="method === 'paste'"
        placeholder="paste key"
        @keyup="onChangeString"
      />
      <div v-if="jwk?.valid" class="flex text-green-700">
        <Check :size="16" class="mr-1" color="green" />
        <span color="green"
          >Valid <span class="font-bold">{{ jwk.keyType }}</span> key</span
        >
      </div>
    </div>
    <Field
      v-if="jwk?.keyType == 'private'"
      orientation="horizontal"
      class="py-1"
    >
      <Checkbox id="with-pub" v-model="checked" />
      <Label for="with-pub">秘密鍵に対応する公開鍵を同時に設定する</Label>
    </Field>
    <DialogClose as-child>
      <Button type="submit" :disabled="!jwk?.valid" @click="onSubmit">
        この鍵を使用
      </Button>
    </DialogClose>
  </div>
</template>
