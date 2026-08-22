<script setup lang="ts">
import { ICONS } from "#imports"
import { CalendarDate, parseDate } from "@internationalized/date"
import { breakpointsTailwind, useBreakpoints, useSSRWidth } from "@vueuse/core"

withDefaults(
  defineProps<{
    min?: string
    max?: string
    showIcons?: boolean
  }>(),
  {
    showIcons: true
  }
)

const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")

const date = defineModel<CalendarDate>()
</script>

<template>
  <u-calendar
    v-model="date"
    :placeholder="min ? parseDate(min) : undefined"
    :week-starts-on="1"
    :weekday-format="mdAndDown ? 'narrow' : 'short'"
    :max-value="max ? parseDate(max) : undefined"
    :min-value="min ? parseDate(min) : undefined"
  />
</template>
