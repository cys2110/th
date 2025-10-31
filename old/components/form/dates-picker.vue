<script setup lang="ts">
import { CalendarDate } from "@internationalized/date"
defineProps<{ placeholder: string; size?: "md"; block?: boolean }>()
const dateRange = defineModel<{ start: CalendarDate | undefined; end: CalendarDate | undefined }>("dateRange")
</script>

<template>
  <u-popover>
    <u-button
      color="neutral"
      :variant="block ? 'outline' : 'link'"
      :icon="ICONS.event"
      :size
      :block
    >
      <template v-if="dateRange?.start">
        <template v-if="dateRange?.end">
          {{ useDateFormat(dateRange.start.toString(), "DD/MM/YY") }}-{{ useDateFormat(dateRange.end.toString(), "DD/MM/YY") }}
        </template>

        <template v-else>{{ useDateFormat(dateRange.start.toString(), "DD/MM/YY") }}</template>
      </template>

      <template v-else>{{ placeholder }}</template>
    </u-button>

    <template #content>
      <u-calendar
        v-model="dateRange"
        range
        :fixed-weeks="false"
        size="sm"
      />
    </template>
  </u-popover>
</template>
