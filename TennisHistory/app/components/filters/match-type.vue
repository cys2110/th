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

const matchTypeOptions = Object.values(MatchTypeEnum.enum)
const matchType = defineModel<MatchTypeEnumType>()
</script>

<template>
  <u-radio-group
    legend="S/D"
    v-model="matchType"
    :items="matchTypeOptions"
    :disabled="disabled"
    :orientation="orientation"
  />
</template>
