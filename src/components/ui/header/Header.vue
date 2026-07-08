<script setup lang="ts">
import { MoonIcon, ShieldCheck, SunIcon } from "@lucide/vue";
import Github from "./Github.vue";
import { useColorMode } from "@vueuse/core";

import { ref } from "vue";
import { Separator } from "@/components/base/separator/index.ts";

defineProps<{
  publicKey: CryptoKey | null;
  privateKey: CryptoKey | null;
}>();
const mode = useColorMode({ initialValue: "auto" });
const current = ref(0);
const modes: Array<typeof mode.value> = ["light", "dark"];
function changeColorMode() {
  current.value += 1;
  mode.value = modes[current.value % modes.length];
}
</script>

<template>
  <header
    class="flex flex-col gap-4 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between px-2"
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
      <div class="flex space-x-2 h-7">
        <div class="inline w-8 h-auto p-0.5" @click="changeColorMode">
          <SunIcon class="w-full h-full" v-if="mode == 'light'" />
          <MoonIcon class="w-full h-full" v-if="mode == 'dark'" />
        </div>

        <Separator orientation="vertical" />
        <Github class="inline w-8 h-auto" />
      </div>
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
