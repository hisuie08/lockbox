<script setup lang="ts">
import AlertView from "../alerts/AlertView.vue";
</script>

<template>
  <AlertView
    :title="'鍵のペアが一致していません'"
    :description="'この公開鍵で暗号化したファイルを、この秘密鍵で復号化は出来ないことに注意してください'"
  ></AlertView>
</template>
