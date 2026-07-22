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
  InputGroupInput,
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
  <div class="grid">
    <label class="grid gap-2">
      <span class="text-sm font-medium">
        {{ keyHandle.keyType == "public" ? "公開鍵" : "秘密鍵" }}
        <span v-if="keyHandle.key.value" class="ml-1 text-primary">
          Loaded
        </span>
      </span>

      <InputGroup>
        <InputGroupInput :value="keyHandle.thumbprint.value" readonly />
        <InputGroupAddon align="inline-end">
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <InputGroupButton variant="ghost" size="icon-xs" class="border-0">
                <MoreHorizontal />
              </InputGroupButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              :side-offset="8"
              :align-offset="-4"
            >
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
    </label>
    <Dialog v-model:open="isOpen" modal>
      <DialogContent :aria-describedby="undefined">
        <EditDialog :key-handle="keyHandle" />
      </DialogContent>
    </Dialog>
  </div>
</template>
