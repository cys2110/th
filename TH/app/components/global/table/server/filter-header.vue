<script setup lang="ts">
/**
 * Header component for filterable table columns where server-side filtering is applied.
 * @prop label - Label for the filter header.
 * @prop options - Array of options for filtering.
 * @prop multiple - Whether multiple selections are allowed.
 * @model modelValue - Two-way bound model for selected filter options.
 */

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

const {
  ui: { icons }
} = useAppConfig()

const handleClear = () => {
  set(modelValue, props.multiple ? [] : null)
}
</script>

<template>
  <u-input-menu
    v-model="modelValue"
    :placeholder="label"
    :items="options"
    variant="none"
    :icon="ICONS.filter"
    class="min-w-30"
    :multiple="multiple"
  >
    <template #content-bottom>
      <u-button
        label="Clear"
        @click="handleClear"
        :icon="icons.close"
        block
        class="rounded-t-none"
      />
    </template>
  </u-input-menu>
</template>
