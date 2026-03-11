<template>
  <div>
    <svg-icon icon-class="github" @click="goto" />
  </div>
</template>

<script setup>
const url = ref('REPLACE_WITH_YOUR_REPO_URL');

function goto() {
  window.open(url.value)
}
</script>
