<script setup lang="ts">
import { Card, CardContent } from "@/components/base/card";
import { FileKey2 } from "lucide-vue-next";
</script>

<template>
  <Card class="rounded-lg" size="sm">
    <CardContent class="grid gap-3 pt-0">
      <div class="flex items-center gap-2 text-sm font-medium">
        <FileKey2 aria-hidden="true" class="size-4" />
        暗号化アルゴリズム
      </div>
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div class="rounded-md bg-muted px-3 py-2">X25519-HKDF-SHA-256</div>
        <div class="rounded-md bg-muted px-3 py-2">AES-GCM-256</div>
      </div>
    </CardContent>
  </Card>
</template>
