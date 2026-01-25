<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: string
    placeholder: string
    disabled?: boolean
    icon?: string
  }>(),
  {
    type: "text",
    disabled: false
  }
)

const modelValue = defineModel<string | number>()

const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <u-input
    :type
    :placeholder
    :disabled
    v-model="modelValue"
    :icon
  >
    <template
      #trailing
      v-if="isDefined(modelValue) && !disabled"
    >
      <u-button
        color="neutral"
        variant="link"
        :icon="icons.close"
        @click="modelValue = undefined"
      />
    </template>
  </u-input>
</template>
