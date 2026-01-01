<script setup lang="ts">
/**
 * Tour filter component allowing selection of tours via checkboxes.
 * @prop tourOptions - Array of checkbox items representing available tours.
 * @model tours - Two-way bound model for selected tours.
 */

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
