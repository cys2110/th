<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: string
    placeholder: string
    icon?: string
    disabled?: boolean
  }>(),
  {
    type: "text",
    disabled: false
  }
)

const modelValue = defineModel<any>()

const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <u-input
    :type
    :placeholder
    :disabled="disabled"
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
