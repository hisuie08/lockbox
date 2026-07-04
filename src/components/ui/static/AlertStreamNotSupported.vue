<script setup lang="ts">
import AlertView from "../alerts/AlertView.vue";
</script>

<template>
  <AlertView
    :title="'このブラウザはストリームダウンロードをサポートしていません'"
    :description="'扱うことができるファイルサイズが制限されています'"
  ></AlertView>
</template>
