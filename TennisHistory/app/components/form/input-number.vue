<script setup lang="ts">
withDefaults(
  defineProps<{
    placeholder: string
    currency?: CurrencyEnumType
    disabled?: boolean
  }>(),
  {
    disabled: false
  }
)

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
    :disabled
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
        v-if="isDefined(modelValue)"
        color="neutral"
        variant="link"
        :icon="icons.close"
        aria-label="Clear input"
        @click="modelValue = undefined"
      />
      <template v-else>{{ "" }}</template>
    </template>
  </u-input-number>
</template>
