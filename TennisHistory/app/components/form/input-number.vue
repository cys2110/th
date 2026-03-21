<script setup lang="ts">
withDefaults(
  defineProps<{
    placeholder: string
    currency?: string
    disabled?: boolean
    icon?: string
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
    :icon
    :decrement="!!icon"
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
      <template v-else>{{ " " }}</template>
    </template>

    <template #decrement>
      <u-icon
        :name="icon"
        class="text-base"
      />
    </template>
  </u-input-number>
</template>
