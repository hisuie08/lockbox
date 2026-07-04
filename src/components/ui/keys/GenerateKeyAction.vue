<template>
  <button
    :disabled="keys.isGenerating"
    class="group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 bg-primary text-primary-foreground hover:bg-primary/80 h-9 gap-1.5 px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2"
    @click="openAndGenerate"
  >
    <KeyRound aria-hidden="true" />
    {{ keys.isGenerating ? "作成中" : "新規鍵ペア" }}
  </button>

  <Teleport to="body">
    <div v-if="isOpen">
      <div
        data-slot="dialog-overlay"
        class="fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
      />
      <div
        data-slot="dialog-content"
        class="fixed top-1/2 left-1/2 z-50 grid max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-6 rounded-xl bg-popover p-6 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-md data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 h-auto max-h-[90vh] w-full sm:w-[500px]"
      >
        <div data-slot="card-title" class="text-base leading-normal font-medium group-data-[size=sm]/card:text-sm">
          新しい鍵ペアの作成
        </div>
        <div data-slot="card-content" class="px-6 group-data-[size=sm]/card:px-4 grid gap-5">
          <div class="grid gap-3">
            <div class="grid gap-3">
              <CopyableKeyView
                :generating="keys.isGenerating"
                :key-text="JSON.stringify(pubKey)"
                key-label="公開鍵"
                :callback="() => setPubSaved(true)"
              />
              <CopyableKeyView
                :generating="keys.isGenerating"
                :key-text="JSON.stringify(privKey)"
                key-label="秘密鍵"
                as-secret
                :callback="() => setPrivSaved(true)"
              />
              <span class="text-destructive">
                秘密鍵は決して他人に共有しないでください
              </span>
              <span class="text-destructive">
                これらの鍵ペアは今しか表示されません。確実に保存してください
              </span>
            </div>
          </div>

          <div class="grid gap-2">
            <DownloadPubKey
              :key-text="JSON.stringify(pubKey)"
              :callback-saved="setPubSaved"
              :is-generating="keys.isGenerating"
            />
            <DownloadPrivKey
              :key-text="JSON.stringify(privKey)"
              :callback-saved="setPrivSaved"
              :is-generating="keys.isGenerating"
            />
          </div>
          <button
            :disabled="!closable"
            class="group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 bg-primary text-primary-foreground hover:bg-primary/80 h-9 gap-1.5 px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2"
            @click="useGeneratedKeys"
          >
            {{ closable ? "鍵ペアを使用する" : "2つの鍵を 保存 または コピー してください" }}
          </button>
          <button
            class="group/button inline-flex shrink-0 items-center justify-center rounded-md border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 border-border bg-background shadow-xs hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50 h-9 gap-1.5 px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2"
            @click="isOpen = false"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { useCryptoKeys } from "@/hooks/useCryptoKeys";
import { computed, ref } from "vue";
import { KeyRound } from "lucide-vue-next";
import CopyableKeyView from "./CopyableKeyView.vue";
import DownloadPrivKey from "./DownloadPrivKey.vue";
import DownloadPubKey from "./DownloadPubKey.vue";

const props = defineProps<{
  keys: ReturnType<typeof useCryptoKeys>;
}>();

const isOpen = ref(false);
const pubKey = ref<JsonWebKey | null>(null);
const privKey = ref<JsonWebKey | null>(null);
const isPubSaved = ref(false);
const isPrivSaved = ref(false);
const closable = computed(() => isPubSaved.value && isPrivSaved.value);

function init() {
  isPubSaved.value = false;
  isPrivSaved.value = false;
}

function setPubSaved(value: boolean) {
  isPubSaved.value = value;
}

function setPrivSaved(value: boolean) {
  isPrivSaved.value = value;
}

async function generate() {
  const { publicJwk, privateJwk } = await props.keys.generateKeys();
  pubKey.value = publicJwk;
  privKey.value = privateJwk;
}

function openAndGenerate() {
  isOpen.value = true;
  init();
  generate();
}

function useGeneratedKeys() {
  props.keys.importPublicJwk(pubKey.value!);
  props.keys.importPrivateJwk(privKey.value!);
  isOpen.value = false;
}
</script>
