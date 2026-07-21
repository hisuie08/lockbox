<script setup lang="ts">
import { CardDescription, CardHeader, CardTitle } from "@/components/base/card";
import type { KeyState } from "@/composables/useKeyState";
import { LockKeyhole, UnlockKeyhole } from "lucide-vue-next";

const props = defineProps<{
  keyState: KeyState;
}>();

const useKey = props.keyState.keyType == "public" ? "公開鍵" : "秘密鍵";
</script>

<template>
  <CardHeader>
    <CardTitle class="flex items-center gap-2">
      <LockKeyhole
        v-if="keyState.keyType == 'public'"
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
