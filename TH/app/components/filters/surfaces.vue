<script setup lang="ts">
/**
 * Surface filter component allowing selection of surfaces via checkboxes.
 * @model surfaces - Two-way bound model for selected surfaces.
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

const surfaceOptions = Object.values(SurfaceEnum.enum)
const surfaces = defineModel<string[]>()
</script>

<template>
  <u-checkbox-group
    legend="Surfaces"
    v-model="(surfaces as SurfaceEnumType[])"
    :items="surfaceOptions"
    :orientation="orientation"
    :disabled="disabled"
  />
</template>
