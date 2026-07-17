<script setup lang="ts">
import { useCryptoKeys } from "@/composables/useCryptoKeys.ts";
import { useFileEncrypt, useFileDecrypt } from "@/composables/useFileCrypto.ts";
import { useShareLink } from "./composables/useShareLink.ts";
import EncryptFileCard from "./components/ui/file/EncryptFileCard.vue";
import DecryptFileCard from "./components/ui/file/DecryptFileCard.vue";
import Header from "./components/ui/header/Header.vue";
import Algorithmns from "./components/ui/algorithms/Algorithmns.vue";
import { Toaster } from "@/components/base/sonner";
import KeyControlCard from "./components/ui/keys/card/KeyControlCard.vue";

const keys = useCryptoKeys();

const enc = useFileEncrypt();
const dec = useFileDecrypt();
const { loadLink } = useShareLink();
onload = async () => {
  const publicJwk = loadLink();
  if (publicJwk != null) await keys.public.importJwk(publicJwk);
};
</script>
<template>
  <div>
    <main class="min-h-dvh bg-background text-foreground">
      <Header
        :publicKey="keys.public.key.value"
        :privateKey="keys.private.key.value"
      />
      <div
        class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-5 sm:px-6 lg:px-8"
      >
        <section class="grid gap-6 lg:grid-cols-[0.3fr_0.9fr]">
          <KeyControlCard :keys="keys" />
          <div class="grid gap-6">
            <EncryptFileCard :files="enc" :keyHandle="keys.public" />
            <DecryptFileCard :files="dec" :keyHandle="keys.private" />
            <Algorithmns />
          </div>
        </section>
      </div>
    </main>
    <Toaster position="bottom-right" />
  </div>
</template>
