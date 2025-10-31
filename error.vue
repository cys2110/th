<script setup lang="ts">
import type { NuxtError } from "#app"

const {
  ui: { icons }
} = useAppConfig()
defineProps<{ error: NuxtError }>()
</script>

<template>
  <u-error
    class="mx-auto"
    :error="{
      statusCode: error.statusCode,
      statusMessage: error.statusCode === 404 ? 'Page not found' : error.statusMessage,
      message: error.message
    }"
    :clear="{
      size: 'xl',
      variant: 'subtle',
      icon: icons.arrowLeft
    }"
  />
</template>
