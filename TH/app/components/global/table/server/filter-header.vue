<script setup lang="ts">
import type { InputMenuItem } from "@nuxt/ui"

/**
 * @description Header component for filterable table columns where server-side filtering is applied.
 * @param label - Label for the filter header.
 * @param options - Array of options for filtering.
 */

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
