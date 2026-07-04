<script setup lang="ts">
import { Progress } from "@/components/base/progress";
import { computed } from "vue";
const props = defineProps<{ progress: number }>();
const indicator = computed(() => props.progress * 100);
</script>
<template>
  <div class="grid gap-1">
    <span class="w-full text-end">{{ indicator }} %</span>
    <Progress class="" v-model="indicator" />
  </div>
</template>
