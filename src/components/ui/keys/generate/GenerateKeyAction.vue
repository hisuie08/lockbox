<script setup lang="ts">
import type { useCryptoKeys } from "@/composables/useCryptoKeys";
import { computed, provide, ref } from "vue";
import { KeyRound } from "lucide-vue-next";
import CopyableKeyView from "./CopyableKeyView.vue";
import { keyIsGenerating } from "../provideKeys.ts";
import { useKeyGenerations } from "@/composables/useKeyGeneration.ts";
import DownloadKeyBtn from "./DownloadKeyBtn.vue";
import { Button } from "@/components/base/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/base/dialog/index.ts";
import { CardContent, CardTitle } from "@/components/base/card/index.ts";

const props = defineProps<{
  keys: ReturnType<typeof useCryptoKeys>;
}>();
const { pubKey, privKey, init } = useKeyGenerations();
provide(keyIsGenerating, props.keys.isGenerating);
const isOpen = ref(false);
const closable = computed(() => pubKey.isSaved.value && privKey.isSaved.value);

async function generate() {
  const { publicJwk, privateJwk } = await props.keys.generateKeys();
  pubKey.jwk.value = publicJwk;
  privKey.jwk.value = privateJwk;
}

function openAndGenerate() {
  isOpen.value = true;
  init();
  generate();
}

function submit() {
  props.keys.public.importJwk(pubKey.jwk.value!);
  props.keys.private.importJwk(privKey.jwk.value!);
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
        <KeyRound aria-hidden="true" />
        {{ keys.isGenerating.value ? "作成中" : "新規鍵ペア" }}
      </Button></DialogTrigger
    >
    <DialogContent @pointer-down-outside.prevent :show-close-button="false">
      <CardTitle>新しい鍵ペアの作成</CardTitle>
      <CardContent class="grid gap-5">
        <div class="grid gap-3">
          <CopyableKeyView :gen-key="pubKey">公開鍵</CopyableKeyView>

          <CopyableKeyView :gen-key="privKey">秘密鍵</CopyableKeyView>
          <span class="text-destructive">
            秘密鍵は決して他人に共有しないでください
          </span>
          <span class="text-destructive">
            これらの鍵ペアは今しか表示されません。確実に保存してください
          </span>
        </div>

        <div class="grid gap-2">
          <DownloadKeyBtn :gen-key="pubKey"
            >公開鍵をダウンロード</DownloadKeyBtn
          >

          <DownloadKeyBtn :gen-key="privKey"
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
