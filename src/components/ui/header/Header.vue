<script setup lang="ts">
import { MoonIcon, ShieldCheck, SunIcon } from "lucide-vue-next";
import Github from "./Github.vue";
import { useColorMode } from "@vueuse/core";

import { Separator } from "@/components/base/separator";
import {
  ENCRYPTION_ALGORITHM,
  KEY_DERIVATION_ALGORITHM,
  KEY_EXCHANGE_ALGORITHM,
} from "@/crypt/constants.ts";

const mode = useColorMode({ initialValue: "auto" });
function changeColorMode() {
  mode.value = mode.value == "light" ? "dark" : "light";
}
const base = document.baseURI;
</script>

<template>
  <header
    class="px-4 py-2 flex flex-col gap-4 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between"
  >
    <div class="flex items-center justify-between w-full">
      <div class="flex items-center gap-3">
        <div
          class="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm"
        >
          <ShieldCheck aria-hidden="true" class="size-5" />
        </div>
        <a :href="base">
          <div>
            <h1 class="text-2xl font-semibold tracking-normal">Lockbox(α版)</h1>
            <p class="text-sm text-muted-foreground">
              {{ KEY_EXCHANGE_ALGORITHM }}-{{ KEY_DERIVATION_ALGORITHM }} +
              {{ ENCRYPTION_ALGORITHM }}
            </p>
          </div>
        </a>
      </div>
      <div class="flex space-x-2 h-7 items-center">
        <div class="flex p-0.5" @click="changeColorMode">
          <SunIcon class="w-full h-full" v-if="mode == 'light'" />
          <MoonIcon class="w-full h-full" v-if="mode == 'dark'" />
        </div>
        <Separator orientation="vertical" />
        <Github class="w-8 h-auto" />
      </div>
    </div>
  </header>
</template>
