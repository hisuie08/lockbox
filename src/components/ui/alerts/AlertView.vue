<script setup lang="ts">
import { Alert, AlertDescription, AlertTitle } from "@/components/base/alert";
import { AlertTriangleIcon } from "lucide-vue-next";

defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <Alert
    className="max-w-md border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50"
  >
    <AlertTriangleIcon />
    <AlertTitle>{{ title }}</AlertTitle>
    <AlertDescription>{{ description }}</AlertDescription>
  </Alert>
</template>
