<script setup lang="ts">
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/base/card";

import { KeyRound } from "lucide-vue-next";

import AlertKeyPairMismatch from "../../static/AlertKeyPairMismatch.vue";

import type { useCryptoKeys } from "@/composables/useCryptoKeys";
import GenerateKeyAction from "../generate/GenerateKeyAction.vue";
import KeyView from "./KeyView.vue";

const props = defineProps<{
  keys: ReturnType<typeof useCryptoKeys>;
}>();
</script>

<template>
  <Card class="rounded-lg">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <KeyRound class="size-4" />
        Keys
      </CardTitle>
      <CardDescription> 鍵ペアの管理 </CardDescription>
      <CardAction>
        <GenerateKeyAction :keys="keys" />
      </CardAction>
    </CardHeader>

    <CardContent class="grid gap-5">
      <AlertKeyPairMismatch v-if="keys.mismatchKeys.value" />
      <KeyView :key-handle="keys.public" />
      <KeyView :key-handle="keys.private" />
    </CardContent>
  </Card>
</template>
