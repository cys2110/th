<script setup lang="ts" generic="T">
import type { TableRow } from "@nuxt/ui"

withDefaults(
  defineProps<{
    row: TableRow<T>
    isExpanded?: boolean
    disabled?: boolean
  }>(),
  {
    isExpanded: false,
    disabled: false
  }
)

const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <div class="py-1 flex items-center gap-2">
    <u-button
      variant="ghost"
      :icon="icons.chevronDoubleRight"
      :class="['transition-transform duration-300 hover:bg-transparent active:bg-transparent', isExpanded && 'rotate-90']"
      :disabled
      @click="row.toggleExpanded()"
    />
    <slot />
  </div>
</template>
