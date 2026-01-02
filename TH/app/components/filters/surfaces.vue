<script setup lang="ts">
withDefaults(
  defineProps<{
    items?: SurfaceEnumType[]
    disabled?: boolean
    orientation?: "horizontal" | "vertical"
  }>(),
  {
    disabled: false,
    orientation: "vertical",
    items: () => Object.values(SurfaceEnum.enum)
  }
)

const surfaces = defineModel<string[]>()
</script>

<template>
  <u-checkbox-group
    legend="Surfaces"
    v-model="(surfaces as SurfaceEnumType[])"
    :items="items"
    :orientation="orientation"
    :disabled="disabled"
  />
</template>
