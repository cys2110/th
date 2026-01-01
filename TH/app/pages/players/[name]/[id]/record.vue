<script setup lang="ts">
definePageMeta({ name: "record" })
const {
  params: { id }
} = useRoute("record")
const playerStore = usePlayerStore()
</script>

<template>
  <u-container class="max-w-7xl">
    <u-page>
      <players-wrapper />

      <u-page-body></u-page-body>
    </u-page>
  </u-container>
</template>
