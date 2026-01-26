<script setup lang="ts">
withDefaults(
  defineProps<{
    placeholder: string
    currency?: CurrencyEnumType
    disabled?: boolean
    icon?: string
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
    :step="currency ? 0.01 : undefined"
    :disabled
    :icon
    :format-options="
      currency ?
        {
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

    <template
      #decrement
      v-if="icon"
    >
      <u-icon :name="icon" />
    </template>
  </u-input-number>
</template>
