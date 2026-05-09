<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"

const props = defineProps<{
  stats: PlayerStatsType[]
  status: AsyncDataRequestStatus
}>()

const playerStore = usePlayerStore()

const levels = defineModel<string[] | null>("levels")
const drawType = defineModel<DrawEnumType>("drawType")
const years = defineModel<number[] | undefined>("years")
const surfaces = defineModel<string[] | null>("surfaces")

// Chart configuration
const themeKey = inject(THEME_KEY)

const theme = computed(() => {
  const key = themeKey as keyof typeof COLOURS
  return COLOURS[key] ?? COLOURS.dark
})
const oppositeTheme = computed(() => {
  const key = themeKey === "light" ? "dark" : "light"
  return COLOURS[key as keyof typeof COLOURS]
})

const option = computed(() => ({
  backgroundColor: "transparent",
  grid: { containLabel: true },
  textStyle: { color: theme.value.slate },
  tooltip: {
    trigger: "axis",
    textStyle: { color: theme.value.slate }
  },
  dataset: [
    { source: props.stats, dimensions: ["stat", "percent", "value"] },
    { transform: { type: "filter", config: { dimension: "percent", value: true } } }
  ],
  xAxis: {
    type: "value",
    name: "%",
    max: 100,
    splitLine: { lineStyle: { color: oppositeTheme.value.slate } },
    axisLabel: { formatter: "{value}%" }
  },
  yAxis: { type: "category", inverse: true },
  series: [
    {
      type: "bar",
      encode: { x: "value", y: "stat" },
      datasetIndex: 1,
      tooltip: { valueFormatter: (value: number) => `${value}%` },
      itemStyle: { borderRadius: [0, 25, 25, 0], color: theme.value.sky },
      animationDuration: 2000,
      barMaxWidth: 20
    }
  ]
}))
</script>

<template>
  <u-modal
    :title="playerStore.fullName"
    description="Stats"
    fullscreen
    :ui="{ footer: 'grid grid-cols-2 lg:grid-cols-4 gap-5' }"
  >
    <u-button
      label="Chart"
      :icon="ICONS.barChart"
      block
    />

    <template #body>
      <v-chart
        class="min-h-100 w-full"
        :theme="themeKey || 'dark'"
        :option="option"
        autoresize
        :loading="status === 'pending'"
      />
    </template>

    <template #footer>
      <filters-levels
        v-model="levels as LevelEnumType[]"
        orientation="horizontal"
      />

      <filters-draw-type
        v-model="drawType"
        orientation="horizontal"
      />

      <filters-years v-model="years" />

      <filters-surfaces
        v-model="surfaces as string[]"
        orientation="horizontal"
      />
    </template>
  </u-modal>
</template>
