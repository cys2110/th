<script setup lang="ts">
/**
 * Year filter component allowing selection of years via input menu.
 * @model years - Two-way bound model for selected years.
 */

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
