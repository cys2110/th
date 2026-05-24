<script setup lang="ts">
withDefaults(
  defineProps<{
    placeholder: string
    currency?: string
    disabled?: boolean
  }>(),
  {
    disabled: false
  }
)

const modelValue = defineModel<number | undefined | null>()

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
    :decrement="false"
    :format-options="
      currency ?
        {
          style: 'currency',
          currency: currency
        }
      : undefined
    "
    class="w-full"
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
      <template v-else>{{ " " }}</template>
    </template>
  </u-input-number>
</template>
