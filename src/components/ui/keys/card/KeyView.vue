<script setup lang="ts">
import { ref } from "vue";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/base/dropdown-menu";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/base/input-group";

import {
  Edit2Icon,
  MoreHorizontal,
  Share2Icon,
  TrashIcon,
} from "lucide-vue-next";

import { Dialog, DialogContent } from "@/components/base/dialog";
import type { KeyHandle } from "@/composables/useCryptoKeys";
import { useShareLink } from "@/composables/useShareLink";
import { useClipboard } from "@vueuse/core";
import { toast } from "vue-sonner";
import EditDialog from "./EditDialog.vue";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/base/popover/index.ts";
import KeyStatus from "./KeyStatus.vue";
import KeyInfo from "./KeyInfo.vue";
const props = defineProps<{
  keyHandle: KeyHandle;
}>();
const isOpen = ref(false);

const { genLink } = useShareLink();
const { copy } = useClipboard();

function sharePublicKey() {
  if (!props.keyHandle.jwk.value) return;
  const link = genLink(props.keyHandle.jwk.value as JsonWebKey);
  copy(link);
  toast.info("share link was copied");
}
</script>
<template>
  <div>
    <InputGroup class="w-full">
      <Popover>
        <PopoverTrigger as-child>
          <KeyStatus :key-handle="keyHandle" class="px-2" />
        </PopoverTrigger>
        <PopoverContent v-if="keyHandle.key.value">
          <KeyInfo :key-handle="keyHandle" />
        </PopoverContent>
      </Popover>
      <InputGroupAddon align="inline-end">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <InputGroupButton variant="ghost" size="icon-xs" class="border-0">
              <MoreHorizontal />
            </InputGroupButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" :side-offset="8" :align-offset="-4">
            <DropdownMenuItem @select="isOpen = true">
              <Edit2Icon />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              v-if="keyHandle.keyType == 'public'"
              :disabled="!keyHandle.key.value"
              @select="sharePublicKey"
            >
              <Share2Icon />
              Share Link
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem variant="destructive" @select="keyHandle.clear">
              <TrashIcon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </InputGroupAddon>
    </InputGroup>
    <Dialog v-model:open="isOpen" modal>
      <DialogContent :aria-describedby="undefined">
        <EditDialog :key-handle="keyHandle" />
      </DialogContent>
    </Dialog>
  </div>
</template>
