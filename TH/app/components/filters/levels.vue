<script setup lang="ts">
/**
 * Level filter component allowing selection of levels via checkboxes.
 * @prop disabled - Whether the filter is disabled.
 * @model levels - Two-way bound model for selected levels.
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
