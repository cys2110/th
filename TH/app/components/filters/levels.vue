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

const levelOptions = Object.values(LevelEnum.enum)
const levels = defineModel<LevelEnumType[]>()
</script>

<template>
  <u-checkbox-group
    legend="Levels"
    v-model="levels"
    :items="levelOptions"
    :disabled="disabled"
    :orientation="orientation"
  />
</template>
