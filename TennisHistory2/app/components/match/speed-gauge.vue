<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"

const props = defineProps<{
  stat: MatchStatsType["stats"][number]
  status: AsyncDataRequestStatus
}>()

// Chart configuration
const themeKey = inject(THEME_KEY)

const theme = computed(() => {
  const key = themeKey as keyof typeof COLOURS
  return COLOURS[key] ?? COLOURS.dark
})

const kmhData = [
  {
    value: props.stat.t1,
    name: props.stat.label,
    title: {
      offsetCenter: ["0%", "100%"]
    },
    detail: {
      offsetCenter: ["-100%", "100%"],
      color: theme.value.violet,
      borderColor: theme.value.violet
    },
    itemStyle: { color: theme.value.violet }
  },
  {
    value: props.stat.t2,
    itemStyle: { color: theme.value.emerald },
    detail: {
      offsetCenter: ["100%", "100%"],
      color: theme.value.emerald,
      borderColor: theme.value.emerald
    }
  }
]

const option = ref({
  backgroundColor: "transparent",
  series: [
    {
      type: "gauge",
      data: kmhData,
      max: 300,
      axisLine: { show: false },
      axisLabel: {
        distance: 25
      },
      title: { fontSize: 14 },
      detail: {
        width: 60,
        height: 40,
        fontSize: 14,
        lineHeight: 15,
        color: "inherit",
        borderColor: "inherit",
        borderRadius: 10,
        borderWidth: 1,
        formatter: function (value: any) {
          const milesPerHour = convertKmhToMph(value)
          return `${value} km/h\n${milesPerHour} mph`
        }
      }
    }
  ]
})
</script>

<template>
  <v-chart
    class="min-h-100 w-full"
    :theme="themeKey || 'dark'"
    :option="option"
    autoresize
    :loading="status === 'pending'"
  />
</template>
