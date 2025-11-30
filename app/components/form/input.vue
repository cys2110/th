<script setup lang="ts">
const { type = "text" } = defineProps<{
  placeholder: string
  type?: string
  disabled?: boolean
}>()

const modelValue = defineModel<string | number>()
const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <u-input
    v-model="modelValue"
    :type
    :placeholder
    :disabled
  >
    <template
      v-if="modelValue && !disabled"
      #trailing
    >
      <u-button
        color="neutral"
        variant="link"
        size="xs"
        :icon="icons.close"
        aria-label="Clear input"
        @click="modelValue = undefined"
      />
    </template>
  </u-input>
</template>
