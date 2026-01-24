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
</script>

<template>
  <u-input-menu
    :placeholder="label"
    variant="none"
    clear
    :items
    :multiple
    :icon
    v-model="modelValue"
    class="min-w-30"
  />
</template>
