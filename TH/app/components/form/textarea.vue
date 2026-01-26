<script setup lang="ts">
defineProps<{
  placeholder: string
  icon?: string
}>()

const modelValue = defineModel<string>()

const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <u-textarea
    :placeholder
    :rows="2"
    v-model="modelValue"
    :icon
  >
    <template
      v-if="isDefined(modelValue)"
      #trailing
    >
      <u-button
        color="neutral"
        variant="link"
        :icon="icons.close"
        @click="modelValue = undefined"
      />
    </template>
  </u-textarea>
</template>
