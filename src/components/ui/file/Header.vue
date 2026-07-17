<script setup lang="ts">
import { CardDescription, CardHeader, CardTitle } from "@/components/base/card";
import type { KeyHandle } from "@/composables/useCryptoKeys";
import { LockKeyhole, UnlockKeyhole } from "lucide-vue-next";

const props = defineProps<{
  keyHandle: KeyHandle;
}>();

const useKey = props.keyHandle.keyType == "public" ? "公開鍵" : "秘密鍵";
</script>

<template>
  <CardHeader>
    <CardTitle class="flex items-center gap-2">
      <LockKeyhole
        v-if="keyHandle.keyType == 'public'"
        aria-hidden="true"
        class="size-4"
      />
      <UnlockKeyhole v-else aria-hidden="true" class="size-4" />
      <slot />
    </CardTitle>
    <CardDescription>
      <strong>{{ useKey }}</strong
      >を使用します
    </CardDescription>
  </CardHeader>
</template>
