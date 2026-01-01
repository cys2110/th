<script setup lang="ts">
/**
 * Reusable textarea component for form inputs.
 * @prop {string} placeholder - Placeholder text for the textarea.
 * @model {string} modelValue - Two-way bound model for the textarea value.
 */

defineProps<{
  placeholder: string
}>()

const modelValue = defineModel<string>()

const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <u-textarea
    v-model="modelValue"
    :placeholder
    :rows="2"
  >
    <template
      v-if="isDefined(modelValue)"
      #trailing
    >
      <u-button
        color="neutral"
        variant="link"
        :icon="icons.close"
        aria-label="Clear input"
        @click="modelValue = undefined"
      />
    </template>
  </u-textarea>
</template>
