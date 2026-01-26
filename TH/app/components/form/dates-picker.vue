<script setup lang="ts">
import { CalendarDate } from "@internationalized/date"

const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")
const xlAndUp = breakpoints.greaterOrEqual("xl")

const dateRange = defineModel<{ start: CalendarDate | undefined; end: CalendarDate | undefined }>()

const inputDateRef = useTemplateRef("inputDateRef")
</script>

<template>
  <u-input-date
    ref="inputDateRef"
    v-model="dateRange"
    range
    locale="en-GB"
  >
    <template #trailing>
      <u-popover :reference="inputDateRef?.inputsRef[0]?.$el">
        <u-button
          color="neutral"
          variant="link"
          :icon="ICONS.calendar"
          aria-label="Select a date range"
          class="px-0"
        />

        <template #content>
          <u-calendar
            range
            v-model="dateRange"
            :week-starts-on="1"
            :weekday-format="
              mdAndDown ? 'narrow'
              : xlAndUp ? 'long'
              : 'short'
            "
            class="p-2"
          />
        </template>
      </u-popover>
    </template>
  </u-input-date>
</template>
