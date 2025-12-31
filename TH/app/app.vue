<script setup lang="ts">
import { en_gb } from "@nuxt/ui/locale"

useHead({
  titleTemplate: "%s %separator %category %separator %siteName",
  templateParams: {
    separator: "|",
    siteName: "TennisHistory",
    category: null
  },
  htmlAttrs: { class: "scroll-smooth" }
})

provideSSRWidth(1024)
</script>

<template>
  <u-app
    :locale="en_gb"
    :tooltip="{ delayDuration: 50 }"
    :toaster="{ position: 'top-center', expand: false }"
  >
    <nuxt-loading-indicator color="repeating-linear-gradient(to right,#e0f2fe 0%,#0ea5e9 50%,#0c4a6e 100%)" />

    <Header />

    <u-main>
      <nuxt-page />
    </u-main>

    <Footer />
  </u-app>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.4s;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(1rem);
}
</style>
