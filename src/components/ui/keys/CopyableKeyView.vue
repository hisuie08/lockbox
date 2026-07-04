<template>
  <label class="grid gap-2">
    <span class="text-sm font-medium">{{ keyLabel }}</span>
    <div
      data-slot="input-group"
      role="group"
      class="group/input-group relative flex h-9 w-full min-w-0 items-center rounded-md border border-input shadow-xs transition-[color,box-shadow] outline-none in-data-[slot=combobox-content]:focus-within:border-inherit in-data-[slot=combobox-content]:focus-within:ring-0 has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-3 has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>textarea]:h-auto dark:bg-input/30 dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40 has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=inline-end]]:[&>input]:pr-1.5 has-[>[data-align=inline-start]]:[&>input]:pl-1.5"
    >
      <input
        data-slot="input-group-control"
        class="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent text-ellipsis"
        readonly
        :value="value"
        :type="inputType"
        :disabled="!keyText"
        @focus="event => (event.target as HTMLInputElement).select()"
      />
      <div
        role="group"
        data-slot="input-group-addon"
        data-align="inline-end"
        class="flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium text-muted-foreground select-none group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-4 order-last pr-2 has-[>button]:-mr-1 has-[>kbd]:mr-[-0.15rem]"
      >
        <button
          class="group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50 flex items-center gap-2 text-sm shadow-none size-6 rounded-[calc(var(--radius)-5px)] p-0 has-[>svg]:p-0 border-0"
          aria-label="Copy"
          title="Copy"
          type="button"
          @click="copyKey"
        >
          <Copy v-if="!copied" aria-hidden="true" />
          <Check v-else aria-hidden="true" />
        </button>
      </div>
    </div>
  </label>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Check, Copy } from "lucide-vue-next";
import { toast } from "sonner";

const props = defineProps<{
  generating: boolean;
  keyLabel: string;
  keyText: string;
  asSecret?: boolean;
  callback: (value: boolean) => void;
}>();

const copied = ref(false);
const inputType = computed(() => (props.asSecret ? "password" : "text"));
const value = computed(() => (!props.generating ? props.keyText : "Generating..."));

async function copyKey() {
  try {
    await navigator.clipboard.writeText(props.keyText);
    toast.success(`${props.keyLabel} copied`);
  } catch {
    toast.error("Clipboard permission was blocked.");
  }
  copied.value = true;
  window.setTimeout(() => {
    copied.value = false;
  }, 2000);
  props.callback(true);
}
</script>
