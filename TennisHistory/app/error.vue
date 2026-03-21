<script setup lang="ts">
import type { NuxtError } from "#app"

defineProps<{
  error: NuxtError
}>()
</script>

<template>
  <u-app>
    <Header />

    <u-error :error />

    <Footer />
  </u-app>
</template>
