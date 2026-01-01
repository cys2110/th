<script setup lang="ts">


import { CalendarDate, parseDate } from "@internationalized/date"

defineProps<{
  min?: string
  max?: string
}>()

const date = defineModel<CalendarDate>()

const inputDateRef = useTemplateRef("inputDateRef")
</script>

<template>
  <u-input-date
    ref="inputDateRef"
    v-model="date"
    locale="en-GB"
    :min-value="min ? parseDate(min) : undefined"
    :max-value="max ? parseDate(max) : undefined"
  >
    <template #trailing>
      <u-popover :reference="inputDateRef?.inputsRef[3]?.$el">
        <u-button
          color="neutral"
          variant="link"
          :icon="ICONS.calendar"
          aria-label="Select date"
          class="px-0"
        />

        <template #content>
          <u-calendar
            v-model="date"
            class="px-2"
            :week-starts-on="1"
            weekday-format="long"
            :min-value="min ? parseDate(min) : undefined"
            :max-value="max ? parseDate(max) : undefined"
            :placeholder="min ? parseDate(min) : undefined"
          />
        </template>
      </u-popover>
    </template>
  </u-input-date>
</template>
