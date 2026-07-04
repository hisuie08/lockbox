<script setup lang="ts">
import AlertStreamNotSupported from './components/ui/static/AlertStreamNotSupported.vue';
import { useCryptoKeys } from '@/composables/useCryptKeys.ts';
import { useStreamSupport } from '@/composables/useStreamSupport.ts';
import { useFileEncrypt, useFileDecrypt } from '@/composables/useFileCryptoStream.ts';
import { useShareLink } from './hooks/useShareLink.ts';
import EncryptFileCard from './components/ui/file/EncryptFileCard.vue';
const MAX_FILE_SIZE = 1.5 * 1024 * 1024 * 1024;
const WARNING_FILE_SIZE = 500 * 1024 * 1024;

  const keys = useCryptoKeys();

  const streamSupported = useStreamSupport();
  const option = {
    streamSupport: streamSupported,
    maxFileSize: MAX_FILE_SIZE,
    warnFileSize: WARNING_FILE_SIZE,
  };
  const enc = useFileEncrypt(option);
  const dec = useFileDecrypt(option);
const { loadLink } = useShareLink();
    onload = async () => {
    const publicJwk = loadLink();
    if (publicJwk != null) await keys.importPublicJwk(publicJwk);
  };
</script>
<template>
  <main class="min-h-dvh bg-background text-foreground">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <Header />
        <AlertStreamNotSupported v-if="!streamSupported.isSupported" />
        <section className="grid gap-6 lg:grid-cols-[0.3fr_0.9fr]">
          <KeyControlCard keys={keys} />

          <div className="grid gap-6">
            <EncryptFileCard :files=enc :keys={keys} />
            <DecryptFileCard files={dec} keys={keys} />

            <Algorithmns />
          </div>
        </section>
      </div>
      <Toaster position="bottom-right" />
  </main>
</template>

<script setup lang="ts">
</script>