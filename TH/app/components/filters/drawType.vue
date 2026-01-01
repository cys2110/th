<script setup lang="ts">
/**
 * Draw type filter component allowing selection of draw types via radio buttons.
 * @model drawType - Two-way bound model for selected draw type.
 */

withDefaults(
  defineProps<{
    disabled?: boolean
    orientation?: "horizontal" | "vertical"
  }>(),
  {
    disabled: false,
    orientation: "vertical"
  }
)

const drawOptions = Object.values(DrawEnum.enum)
const drawType = defineModel<DrawEnumType>()
</script>

<template>
  <u-radio-group
    legend="S/D"
    v-model="drawType"
    :items="drawOptions"
    :disabled="disabled"
    :orientation="orientation"
  />
</template>
