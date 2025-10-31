<script setup lang="ts">
defineProps<{ placeholder: string }>()
const modelValue = defineModel<any>()
</script>

<template>
  <u-popover>
    <u-button
      color="neutral"
      variant="outline"
      :icon="ICONS.event"
      block
    >
      {{ modelValue ? `${modelValue.day} ${MonthEnum[modelValue.month as keyof typeof MonthEnum]} ${modelValue.year}` : placeholder }}
    </u-button>

    <template #content>
      <u-calendar v-model="modelValue" />
    </template>
  </u-popover>
</template>
