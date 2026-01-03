<script setup lang="ts">
import type { InputMenuItem } from "@nuxt/ui"

const props = withDefaults(
  defineProps<{
    label: string
    options: InputMenuItem[]
    multiple?: boolean
  }>(),
  {
    multiple: false
  }
)

const modelValue = defineModel<any>()

const parsedModelValue = computed({
  get: () => {
    if (modelValue.value) {
      return modelValue.value
    } else {
      return undefined
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
    v-model="parsedModelValue"
    :placeholder="label"
    :items="options"
    variant="none"
    :icon="ICONS.filter"
    class="min-w-30"
    :multiple="multiple"
    clear
  />
</template>
