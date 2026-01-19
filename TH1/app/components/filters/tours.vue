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
    v-model="<any>tours"
    :items="tourOptions"
    loop
    :icon="ICONS.tour"
  />
</template>
