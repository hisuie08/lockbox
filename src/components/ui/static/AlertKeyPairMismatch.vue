<template>
  <div
    role="alert"
    data-slot="alert"
    class="group/alert relative grid w-full gap-0.5 rounded-lg border px-4 py-3 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4 max-w-md border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50"
  >
    <AlertTriangleIcon />
    <div
      data-slot="alert-title"
      class="font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground"
    >
      鍵のペアが一致していません
    </div>
    <div
      data-slot="alert-description"
      class="text-sm text-balance text-muted-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4"
    >
      この公開鍵で暗号化したファイルを、この秘密鍵で復号化は出来ないことに注意してください
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertTriangleIcon } from "lucide-vue-next";
</script>
