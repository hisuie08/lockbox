<script setup lang="ts">
import { Card, CardContent } from "@/components/base/card";
import {
  ENCRYPTION_ALGORITHM,
  HASH_ALGORITHM,
  KEY_DERIVATION_ALGORITHM,
  KEY_EXCHANGE_ALGORITHM,
} from "@/crypt";
import { FileKey2 } from "lucide-vue-next";
</script>

<template>
  <Card class="rounded-lg" size="sm">
    <CardContent class="grid gap-3 pt-0">
      <div class="flex items-center gap-2 text-sm font-medium">
        <FileKey2 aria-hidden="true" class="size-4" />
        使用アルゴリズム
      </div>
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div class="rounded-md bg-muted px-3 py-2">
          {{
            `${KEY_EXCHANGE_ALGORITHM}-${KEY_DERIVATION_ALGORITHM}-${HASH_ALGORITHM}`
          }}
        </div>
        <div class="rounded-md bg-muted px-3 py-2">
          {{ ENCRYPTION_ALGORITHM }}
        </div>
      </div>
    </CardContent>
  </Card>
</template>
