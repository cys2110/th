<script setup lang="ts">
import { CalendarDate } from "@internationalized/date"

defineProps<{ placeholder?: string }>()
const inputDateRef = useTemplateRef("inputDateRef")
const dateRange = defineModel<{ start: CalendarDate | undefined; end: CalendarDate | undefined }>()
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
          :icon="ICONS.event"
          aria-label="Select a date range"
          class="px-0"
        />

        <template #content>
          <u-calendar
            v-model="dateRange"
            class="p-2"
            range
            :week-starts-on="1"
            weekday-format="long"
          />
        </template>
      </u-popover>
    </template>
  </u-input-date>
</template>
