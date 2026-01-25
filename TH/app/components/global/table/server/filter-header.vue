<script setup lang="ts">
import type { InputMenuItem } from "@nuxt/ui"

const props = withDefaults(
  defineProps<{
    label: string
    filterKey: string
    type: "stringArray" | "number" | "option"
    items: InputMenuItem[]
    multiple?: boolean
    icon?: string
  }>(),
  {
    multiple: false,
    icon: "line-md:filter-twotone"
  }
)

const modelValue = useRouteQuery<any>(props.filterKey, null, {
  transform:
    props.type === "number" ? Number
    : props.type === "stringArray" ? toArray
    : {
        get: parseOption,
        set: serialiseOption
      }
})

const safeModelValue = computed({
  get: () => {
    if (modelValue.value) return modelValue.value
    return props.multiple ? [] : null
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
    :placeholder="label"
    variant="none"
    clear
    :items
    :multiple
    :icon
    v-model="safeModelValue"
  />
</template>
