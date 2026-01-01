<script setup lang="ts">


import type { CheckboxGroupItem } from "@nuxt/ui"

withDefaults(
  defineProps<{
    tourOptions?: CheckboxGroupItem[]
  }>(),
  {
    tourOptions: () => TOUR_OPTIONS
  }
)

const tours = defineModel()
</script>

<template>
  <u-checkbox-group
    legend="Tours"
    v-model="(tours as any)"
    :items="tourOptions"
  />
</template>
