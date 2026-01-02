<script setup lang="ts">
withDefaults(
  defineProps<{
    yearOptions?: number[]
    disabled?: boolean
    multiple?: boolean
  }>(),
  {
    yearOptions: () => ALL_YEARS,
    disabled: false,
    multiple: false
  }
)

const years = defineModel<number[]>()
</script>

<template>
  <form-input-menu
    v-model="years"
    placeholder="Years"
    :items="yearOptions"
    :icon="ICONS.years"
    :multiple="multiple"
    :disabled="disabled"
  />
</template>
