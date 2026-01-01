<script setup lang="ts">


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
