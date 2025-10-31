<script setup lang="ts">
defineProps<{ placeholder: string; block?: boolean }>()
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
  >
    <template #increment>
      <u-button
        v-if="modelValue !== undefined"
        color="neutral"
        variant="ghost"
        size="xs"
        :icon="icons.close"
        aria-label="Clear input"
        @click="modelValue = undefined"
      />
      <template v-else>{{ "" }}</template>
    </template>
  </u-input-number>
</template>
