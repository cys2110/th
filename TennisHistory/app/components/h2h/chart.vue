<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"

const props = defineProps<{
  t1Wins: number
  t2Wins: number
  title: string
  status: AsyncDataRequestStatus
}>()

// Chart configuration
const themeKey = inject(THEME_KEY)

const theme = computed(() => {
  const key = themeKey as keyof typeof COLOURS
  return COLOURS[key] ?? COLOURS.dark
})

const formattedData = computed(() => [
  { value: props.t1Wins, itemStyle: { color: theme.value.violet } },
  { value: props.t2Wins, itemStyle: { color: theme.value.emerald } }
])

const option = computed(() => ({
  backgroundColor: "transparent",
  textStyle: { color: theme.value.slate },
  title: {
    text: props.title,
    top: "middle",
    textStyle: {
      color: theme.value.sky,
      fontSize: 14
    }
  },
  series: [
    {
      type: "pie",
      radius: ["80%", "90%"],
      data: formattedData.value,
      startAngle: 180,
      label: {
        formatter: () =>
          `${props.t1Wins}—${props.t2Wins}\n${props.t1Wins + props.t2Wins ? percentage(props.t1Wins, props.t1Wins + props.t2Wins) : 0}%—${
            props.t1Wins + props.t2Wins ? percentage(props.t2Wins, props.t1Wins + props.t2Wins) : 0
          }%`,
        position: "center",
        fontWeight: "bolder",
        fontSize: 18,
        lineHeight: 40
      }
    }
  ]
}))
</script>

<template>
  <div class="h-30 md:h-60 min-w-30 md:min-w-60 lg:min-w-80 w-fit mx-auto">
    <v-chart
      class="min-h-full w-full flex-1"
      :theme="themeKey || 'dark'"
      :option="option"
      autoresize
      :loading="status === 'pending'"
    />
  </div>
</template>
