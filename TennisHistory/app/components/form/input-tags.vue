<script setup lang="ts">
defineProps<{
  placeholder: string
  max?: number
  convertValue?: (value: string) => string
}>()

const modelValue = defineModel<string[]>()
</script>

<template>
  <u-input-tags
    v-model="modelValue"
    :placeholder
    :max
    add-on-paste
    :convert-value
  />
</template>
