<script setup lang="ts">
import type { NuxtError } from "#app"

defineProps<{
  error: NuxtError
}>()
</script>

<template>
  <u-app>
    <Header />

    <u-error
      icon="icon-park-twotone:file-failed"
      :error
    />

    <Footer />
  </u-app>
</template>
