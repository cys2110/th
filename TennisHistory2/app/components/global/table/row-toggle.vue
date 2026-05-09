<script setup lang="ts" generic="T">
import type { TableRow } from "@nuxt/ui"

withDefaults(
  defineProps<{
    row: TableRow<T>
    disabled?: boolean
  }>(),
  {
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
      :disabled
      @click="row.toggleExpanded()"
      :class="['transition-transform duration-300 hover:bg-transparent active:bg-transparent', row.getIsExpanded() && 'rotate-90']"
    />
    <slot />
  </div>
</template>
