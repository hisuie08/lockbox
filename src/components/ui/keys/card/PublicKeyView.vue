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
import type { useCryptoKeys } from "@/composables/useCryptoKeys";
import { useShareLink } from "@/composables/useShareLink";
import { useClipboard } from "@vueuse/core";
import { toast } from "vue-sonner";
import EditDialog from "./EditDialog.vue";
const props = defineProps<{
  keys: ReturnType<typeof useCryptoKeys>;
}>();
const isOpen = ref(false);

const { genLink } = useShareLink();
const { copy } = useClipboard();

function sharePublicKey() {
  if (!props.keys.public.jwk.value) return;
  const link = genLink(props.keys.public.jwk.value as JsonWebKey);
  copy(link);
  toast.info("share link was copied");
}
</script>
<template>
  <div class="grid">
    <label class="grid gap-2">
      <span class="text-sm font-medium">
        公開鍵

        <span v-if="keys.public.key.value" class="ml-1 text-green-700">
          Loaded
        </span>
      </span>

      <InputGroup>
        <InputGroupInput :model-value="keys.public.thumbprint" readonly />
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
                :disabled="!keys.public.key.value"
                @select="sharePublicKey"
              >
                <Share2Icon />
                Share Link
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                variant="destructive"
                @select="keys.clearPublicKey"
              >
                <TrashIcon />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </InputGroupAddon>
      </InputGroup>
    </label>
    <Dialog v-model:open="isOpen" modal>
      <DialogContent>
        <EditDialog :keyType="'public'" :callback="keys.importPublicJwk" />
      </DialogContent>
    </Dialog>
  </div>
</template>
