<script setup lang="ts">
withDefaults(
  defineProps<{
    items: any[]
    placeholder?: string
    multiple?: boolean
    disabled?: boolean
  }>(),
  {
    multiple: false,
    placeholder: "Select an option",
    disabled: false
  }
)

const modelValue = defineModel<any>()

const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <u-input-menu
    v-model="modelValue"
    :items
    :placeholder
    :multiple
    :disabled
    clear
  />
</template>
