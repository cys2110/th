<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    placeholder?: string
    yearOptions?: number[]
    disabled?: boolean
    multiple?: boolean
  }>(),
  {
    placeholder: "Years",
    yearOptions: () => ALL_YEARS,
    disabled: false,
    multiple: false
  }
)

const modelValue = defineModel<number[] | number | null>()

const years = computed({
  get: () => {
    if (modelValue.value) {
      return modelValue.value
    } else {
      return props.multiple ? [] : undefined
    }
  },
  set: (val: any) => {
    if (val) {
      modelValue.value = val
    } else {
      modelValue.value = props.multiple ? [] : null
    }
  }
})
</script>

<template>
  <u-input-menu
    v-model="years"
    :placeholder
    :items="yearOptions"
    :icon="ICONS.years"
    :multiple
    :disabled
    clear
  />
</template>
