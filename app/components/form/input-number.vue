<script setup lang="ts">
defineProps<{
  placeholder: string
  currency?: CurrencyEnumType
}>()
const modelValue = defineModel<number>()
const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <u-input-number
    v-model="modelValue"
    :placeholder
    :decrement="false"
    :step="currency ? 0.01 : undefined"
    :format-options="
      currency
        ? {
            style: 'currency',
            currency: currency
          }
        : undefined
    "
  >
    <template #increment>
      <u-button
        v-if="modelValue !== undefined"
        color="neutral"
        variant="link"
        size="xs"
        :icon="icons.close"
        aria-label="Clear input"
        @click="modelValue = undefined"
      />
      <template v-else>{{ "" }}</template>
    </template>
  </u-input-number>
</template>
