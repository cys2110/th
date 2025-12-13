<script setup lang="ts">
defineProps<{ placeholder: string }>()
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
        size="xs"
        :icon="icons.close"
        aria-label="Clear input"
        @click="modelValue = undefined"
      />
    </template>
  </u-textarea>
</template>
