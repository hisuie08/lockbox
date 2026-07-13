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
import { DialogClose } from "@/components/base/dialog";
import type { KeyAgreementKeyType } from "@/crypt";
const props = defineProps<{
  keyType: KeyAgreementKeyType;
  callback: (jwk: JsonWebKey, withPub?: boolean) => Promise<void>;
}>();
const { isValid, validJwk, loadKeyFile, loadKeyString, error } = useKeyLoad(
  props.keyType,
);
const method = ref<"file" | "paste">("file");
const checked = ref<boolean>(false);
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
  props.callback(validJwk.value!, props.keyType == "private" && checked.value);
}
</script>
<template>
  <DialogTitle>{{ keyType == "public" ? "公開鍵" : "秘密鍵" }}</DialogTitle>
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
      <ErrorView v-if="error" :errors="[error]" />

      <Input v-if="method === 'file'" type="file" @change="onChangeFile" />
      <Textarea
        class="max-h-30 box-border w-full break-all"
        v-if="method === 'paste'"
        placeholder="paste key"
        @keyup="onChangeString"
      />
      <div v-if="isValid" class="flex text-green-700">
        <Check :size="16" class="mr-1" color="green" />
        <span color="green">Valid {{ props.keyType }} key</span>
      </div>
    </div>
    <Field v-if="keyType == 'private'" orientation="horizontal" class="py-1">
      <Checkbox id="with-pub" v-model="checked" />
      <Label for="with-pub">秘密鍵に対応する公開鍵を同時に設定する</Label>
    </Field>
    <DialogClose as-child>
      <Button type="submit" :disabled="!isValid" @click="onSubmit">
        この鍵を使用
      </Button>
    </DialogClose>
  </div>
</template>
