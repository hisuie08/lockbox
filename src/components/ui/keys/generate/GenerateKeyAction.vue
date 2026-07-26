<script setup lang="ts">
import type { useCryptoKeys } from "@/composables/useCryptoKeys";
import { computed, provide, ref } from "vue";
import { PlusIcon } from "lucide-vue-next";
import CopyableKeyView from "./CopyableKeyView.vue";
import { keyIsGenerating } from "../provideKeys.ts";
import DownloadKeyBtn from "./DownloadKeyBtn.vue";
import { Button } from "@/components/base/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/base/dialog";
import { CardContent } from "@/components/base/card";

const props = defineProps<{
  keys: ReturnType<typeof useCryptoKeys>;
}>();
const { generatedPubKey, generatedPrivKey } = props.keys.generator;
provide(keyIsGenerating, props.keys.isGenerating);
const isOpen = ref(false);
const closable = computed(
  () => generatedPubKey.isSaved.value && generatedPrivKey.isSaved.value,
);

function openAndGenerate() {
  isOpen.value = true;
  props.keys.generateKeys();
}

function submit() {
  props.keys.public.importJwk(generatedPubKey.jwk.value!);
  props.keys.private.importJwk(generatedPrivKey.jwk.value!);
  isOpen.value = false;
}
function cancel() {
  isOpen.value = false;
}
</script>

<template>
  <Dialog modal v-model:open="isOpen">
    <DialogTrigger as-child>
      <Button :disabled="keys.isGenerating.value" @click="openAndGenerate">
        <PlusIcon aria-hidden="true" />
        {{ keys.isGenerating.value ? "作成中" : "鍵ペア作成" }}
      </Button></DialogTrigger
    >
    <DialogContent
      @pointer-down-outside.prevent
      :show-close-button="false"
      :aria-describedby="undefined"
    >
      <DialogTitle>新しい鍵ペアの作成</DialogTitle>
      <CardContent class="grid gap-5">
        <div class="grid gap-3">
          <CopyableKeyView :gen-key="generatedPubKey">公開鍵</CopyableKeyView>

          <CopyableKeyView :gen-key="generatedPrivKey">秘密鍵</CopyableKeyView>
          <span class="text-destructive">
            秘密鍵は決して他人に共有しないでください
          </span>
          <span class="text-destructive">
            これらの鍵ペアは今しか表示されません。確実に保存してください
          </span>
        </div>

        <div class="grid gap-2">
          <DownloadKeyBtn :gen-key="generatedPubKey"
            >公開鍵をダウンロード</DownloadKeyBtn
          >

          <DownloadKeyBtn :gen-key="generatedPrivKey"
            >秘密鍵をダウンロード</DownloadKeyBtn
          >
        </div>

        <Button :disabled="!closable" @click="submit">
          {{
            closable
              ? "鍵ペアを使用する"
              : "2つの鍵を 保存 または コピー してください"
          }}
        </Button>
        <Button variant="outline" @click="cancel"> キャンセル </Button>
      </CardContent>
    </DialogContent>
  </Dialog>
</template>
