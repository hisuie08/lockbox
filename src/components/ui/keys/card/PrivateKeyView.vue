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

import { Edit2Icon, MoreHorizontal, TrashIcon } from "lucide-vue-next";

import { Dialog, DialogContent } from "@/components/base/dialog";
import type { KeyHandle } from "@/composables/useCryptoKeys";
import EditDialog from "./EditDialog.vue";
const props = defineProps<{
  keyHandle: KeyHandle;
}>();
const editDialog = ref(false);
</script>
<template>
  <div class="grid">
    <label class="grid gap-2">
      <span class="text-sm font-medium">
        秘密鍵
        <span v-if="keyHandle.key.value" class="ml-1 text-green-700">
          Loaded
        </span>
      </span>

      <InputGroup>
        <InputGroupInput :model-value="keyHandle.thumbprint" readonly />

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
              <DropdownMenuItem @select="editDialog = true">
                <Edit2Icon />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                variant="destructive"
                @select="keyHandle.clear"
              >
                <TrashIcon />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </InputGroupAddon>
      </InputGroup>
    </label>
    <Dialog v-model:open="editDialog">
      <DialogContent>
        <EditDialog :key-handle="keyHandle"
      /></DialogContent>
    </Dialog>
  </div>
</template>
