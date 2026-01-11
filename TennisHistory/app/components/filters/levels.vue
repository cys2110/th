<script setup lang="ts">
withDefaults(
  defineProps<{
    items?: LevelEnumType[]
    disabled?: boolean
    orientation?: "horizontal" | "vertical"
  }>(),
  {
    items: () => Object.values(LevelEnum.enum),
    disabled: false,
    orientation: "vertical"
  }
)

const levels = defineModel<LevelEnumType[]>()
</script>

<template>
  <u-checkbox-group
    legend="Levels"
    v-model="levels"
    :items="items"
    :disabled="disabled"
    :orientation="orientation"
  />
</template>
