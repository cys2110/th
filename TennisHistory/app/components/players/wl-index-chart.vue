<script setup lang="ts">
const { index } = defineProps<{
  index: WLIndexType[]
  levels: string[]
  drawType?: DrawEnumType
  years: number[]
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
  dataset: [{ source: index, dimensions: ["category", "stat", "titles", "value", "wins", "losses"] }],
  xAxis: [
    {
      type: "value",
      name: "Index",
      max: 1,
      splitLine: {
        lineStyle: { color: colorMode.value === "dark" ? COLOURS.lightText : COLOURS.darkText }
      }
    },
    { type: "value", name: "Titles", splitLine: { show: false } }
  ],
  yAxis: { type: "category", inverse: true },
  series: [
    {
      name: "Index",
      type: "bar",
      encode: { x: "value", y: "stat" },
      xAxisIndex: 0,
      tooltip: { valueFormatter: (value: number) => value.toFixed(3) }
    },
    {
      name: "Titles",
      type: "scatter",
      encode: { x: "titles", y: "stat" },
      xAxisIndex: 1,
      symbol: "diamond"
    }
  ]
}))
</script>

<template>
  <u-modal
    title="Win-Loss Index"
    :description="`${levels.join(' / ')}${drawType ? ' | ' + drawType : ''}${years.length ? ' | ' + years.join(', ') : ''}`"
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
