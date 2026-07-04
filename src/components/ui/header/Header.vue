<template>
  <header class="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex items-center gap-3">
      <div class="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <ShieldCheck aria-hidden="true" class="size-5" />
      </div>
      <a href="/">
        <div>
          <h1 class="text-2xl font-semibold tracking-normal">
            Lockbox(α版)
          </h1>
          <p class="text-sm text-muted-foreground">
            X25519-HKDF + AES-GCM
          </p>
        </div>
      </a>
    </div>

    <div class="grid grid-cols-2 gap-2 text-sm sm:flex sm:items-center">
      <a href="https://github.com/hisuie08/lockbox" target="_blank">
        <span>
          <svg
            fill="none"
            height="28"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
            width="28"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
        </span>
      </a>
      <div class="rounded-md border border-border bg-card px-3 py-2">
        <span class="text-muted-foreground">Public</span>
        <span :class="publicKey ? 'font-medium text-emerald-700' : 'font-medium'">
          {{ publicKey ? "Loaded" : "Empty" }}
        </span>
      </div>
      <div class="rounded-md border border-border bg-card px-3 py-2">
        <span class="text-muted-foreground">Private</span>
        <span :class="privateKey ? 'font-medium text-emerald-700' : 'font-medium'">
          {{ privateKey ? "Loaded" : "Empty" }}
        </span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ShieldCheck } from "lucide-vue-next";

defineProps<{
  publicKey: CryptoKey | null;
  privateKey: CryptoKey | null;
}>();
</script>
