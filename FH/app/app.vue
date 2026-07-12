<script setup lang="ts">
import { provideSSRWidth } from "@vueuse/core"

useHead({
  titleTemplate: "%s %separator %category %separator %siteName",
  templateParams: {
    separator: "|",
    siteName: "FootballHistory",
    category: null
  }
})

provideSSRWidth(1024)
</script>

<template>
  <u-app
    :tooltip="{ delayDuration: 50 }"
    :toaster="{ position: 'top-right', expand: false }"
  >
    <nuxt-loading-indicator color="repeating-linear-gradient(to right,#bae6fd 0%,#0ea5e9 50%,#0c4a6e 100%)" />

    <Header />

    <u-main>
      <nuxt-page />
    </u-main>
  </u-app>
</template>
