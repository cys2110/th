<script setup lang="ts">
const { stats } = defineProps<{
  stats: PlayerStatsType[]
  levels: string[]
  drawType?: DrawEnumType
  years: number[]
  surfaces: string[]
}>()

const colorMode = useColorMode()

const option = computed(() => ({
  backgroundColor: "transparent",
  textStyle: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText },
  grid: { containLabel: true },
  tooltip: {
    trigger: "axis",
    textStyle: { fontWeight: "bold" }
  },
  legend: {
    textStyle: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText },
    top: "top"
  },
  dataset: [{ source: stats, dimensions: ["stat", "value"] }],
  xAxis: {
    type: "value",
    name: "Index",
    max: 100,
    splitLine: {
      lineStyle: { color: colorMode.value === "dark" ? COLOURS.lightText : COLOURS.darkText }
    },
    axisLabel: { formatter: "{value}%" }
  },
  yAxis: { type: "category", inverse: true },
  series: [
    {
      type: "bar",
      encode: { x: "value", y: "stat" },
      tooltip: { valueFormatter: (value: number) => `${value}%` },
      itemStyle: { color: COLOURS.sky700 }
    }
  ]
}))
</script>

<template>
  <u-modal
    title="Stats"
    :description="`${levels.join(' / ')}${drawType ? ' | ' + drawType : ''}${years.length ? ' | ' + years.join(', ') : ''}${
      surfaces.length ? ' | ' + surfaces.join(' / ') : ''
    }`"
    fullscreen
  >
    <u-button
      label="Chart"
      :icon="ICONS.barChart"
      block
    />

    <template #body>
      <v-chart
        class="min-h-200 w-full"
        :option
        :autoresize="true"
      />
    </template>
  </u-modal>
</template>
