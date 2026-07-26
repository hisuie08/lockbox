<script setup lang="ts">
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/base/card";

import { KeyRound } from "lucide-vue-next";

import type { useCryptoKeys } from "@/composables/useCryptoKeys";
import GenerateKeyAction from "../generate/GenerateKeyAction.vue";
import KeyView from "./KeyView.vue";
import AlertView from "../../alerts/AlertView.vue";

const props = defineProps<{
  keys: ReturnType<typeof useCryptoKeys>;
}>();
</script>

<template>
  <Card class="rounded-lg">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <KeyRound class="size-4" />
        Key Vault
      </CardTitle>
      <CardAction>
        <GenerateKeyAction :keys="keys" />
      </CardAction>
    </CardHeader>

    <CardContent class="grid gap-5">
      <AlertView
        v-if="keys.mismatchKeys.value"
        :title="'鍵のペアが一致していません'"
        :description="'この公開鍵で暗号化したファイルを、この秘密鍵で復号化は出来ないことに注意してください'"
      ></AlertView>
      <div class="grid gap-2 grid-cols-2 lg:grid-cols-1">
        <KeyView :key-handle="keys.public" />
        <KeyView :key-handle="keys.private" />
      </div>
    </CardContent>
  </Card>
</template>
