<script setup lang="ts">
useHead({
  titleTemplate: title => `${title} | TennisHistory`,
  htmlAttrs: { class: "scroll-smooth" }
})

const { viewMode } = useViewMode()
provideSSRWidth(1024)
</script>

<template>
  <u-app :tooltip="{ delayDuration: 100 }" :toaster="{ position: 'top-center' }">
    <nuxt-loading-indicator color="repeating-linear-gradient(to right,#e0f2fe 0%,#0ea5e9 50%,#0c4a6e 100%)" />

    <nuxt-layout :name="viewMode">
      <nuxt-page />
    </nuxt-layout>
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