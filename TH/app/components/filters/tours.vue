<script setup lang="ts">
import type { CheckboxGroupItem } from "@nuxt/ui"

withDefaults(
  defineProps<{
    tourOptions?: CheckboxGroupItem[]
    orientation?: "horizontal" | "vertical"
  }>(),
  {
    tourOptions: () => TOUR_OPTIONS,
    orientation: "vertical"
  }
)

const tours = defineModel()
</script>

<template>
  <u-checkbox-group
    legend="Tours"
    :items="tourOptions"
    v-model="<any>tours"
    loop
    :icon="ICONS.tour"
  />
</template>
