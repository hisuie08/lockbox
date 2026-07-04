<script setup lang="ts">
import { ShieldCheck } from "lucide-vue-next";
import Github from "./Github.vue";

defineProps<{
  publicKey: CryptoKey | null;
  privateKey: CryptoKey | null;
}>();
</script>

<template>
  <header
    class="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between"
  >
  <div class="flex items-center justify-between w-full">
    <div class="flex items-center gap-3">
      <div
        class="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm"
      >
        <ShieldCheck aria-hidden="true" class="size-5" />
      </div>
      <a href="/">
        <div>
          <h1 class="text-2xl font-semibold tracking-normal">Lockbox(α版)</h1>
          <p class="text-sm text-muted-foreground">X25519-HKDF + AES-GCM</p>
        </div>
      </a>
    </div>
    <Github class="inline"/>
</div>
      
    <div class="grid grid-cols-2 gap-2 text-sm sm:flex sm:items-center">
      <div class="flex rounded-md border border-border bg-card px-3 py-2">
        <span class="text-muted-foreground pr-1.5">Public </span>
        <span
          :class="publicKey ? 'font-medium text-emerald-700' : 'font-medium'"
        >
          {{ publicKey ? "Loaded" : "Empty" }}
        </span>
      </div>
      <div class="flex rounded-md border border-border bg-card px-3 py-2">
        <span class="text-muted-foreground pr-1.5">Private </span>
        <span
          :class="privateKey ? 'font-medium text-emerald-700' : 'font-medium'"
        >
          {{ privateKey ? "Loaded" : "Empty" }}
        </span>
      </div>
    </div>
  </header>
</template>
