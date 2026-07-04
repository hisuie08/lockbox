<script setup lang="ts">
defineProps<{
  errors: Array<string>;
}>();
</script>

<template>
  <div>
    <div v-if="errors.length > 0" class="grid gap-2">
      <div
        v-for="error in errors"
        :key="error"
        class="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {{ error }}
      </div>
    </div>
  </div>
</template>
