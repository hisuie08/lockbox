<template>
  <div
    data-slot="card"
    data-size="sm"
    class="group/card flex flex-col gap-6 overflow-hidden rounded-xl bg-card py-6 text-sm text-card-foreground shadow-xs ring-1 ring-foreground/10 has-[>img:first-child]:pt-0 data-[size=sm]:gap-4 data-[size=sm]:py-4 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl rounded-lg"
  >
    <div data-slot="card-content" class="px-6 group-data-[size=sm]/card:px-4 grid gap-3 pt-0">
      <div class="flex items-center gap-2 text-sm font-medium">
        <FileKey2 aria-hidden="true" class="size-4" />
        暗号化アルゴリズム
      </div>
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div class="rounded-md bg-muted px-3 py-2">
          X25519-HKDF-SHA-256
        </div>
        <div class="rounded-md bg-muted px-3 py-2">AES-GCM-256</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FileKey2 } from "lucide-vue-next";
</script>
