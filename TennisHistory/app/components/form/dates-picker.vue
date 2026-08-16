<script setup lang="ts">
import { CalendarDate } from "@internationalized/date"
import { breakpointsTailwind, useBreakpoints, useSSRWidth } from "@vueuse/core"

const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")

const dateRange = defineModel<{ start: CalendarDate | undefined; end: CalendarDate | undefined }>()
</script>

<template>
  <u-calendar
    range
    v-model="dateRange"
    :week-starts-on="1"
    :weekday-format="mdAndDown ? 'narrow' : 'short'"
    class="p-2"
  />
</template>
