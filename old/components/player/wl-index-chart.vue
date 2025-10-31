<script setup lang="ts">
const { index } = defineProps<{
  index: WLIndexInterface[]
}>()
const colorMode = useColorMode()
const playerName = useState<string>("player-name")

const draws = ["Main", "Qualifying"]
const levels = ["Tour", "Challenger", "ITF"]

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
  dataset: [
    { source: index, dimensions: ["draw", "category", "level", "stat", "titles", "value", "ytd_value"] },
    ...levels
      .map(level =>
        draws
          .map(draw => ({
            transform: {
              type: "filter",
              config: {
                and: [
                  { dimension: "level", value: level },
                  { dimension: "draw", value: draw }
                ]
              }
            }
          }))
          .flat()
      )
      .flat()
  ].flat(),
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
    ...levels
      .map((level, index) =>
        draws.map((draw, i) => ({
          name: `${level} ${draw}`,
          type: "bar",
          encode: { x: "value", y: "stat" },
          datasetIndex: index * 2 + i + 1,
          xAxisIndex: 0,
          tooltip: { valueFormatter: (value: number) => value.toFixed(3) }
        }))
      )
      .flat(),
    ...levels
      .map((level, index) =>
        draws.map((draw, i) => ({
          name: `${level} ${draw}`,
          type: "scatter",
          encode: { x: "titles", y: "stat" },
          datasetIndex: index * 2 + i + 1,
          xAxisIndex: 1,
          symbol: "diamond"
        }))
      )
      .flat()
  ]
}))
</script>

<template>
  <u-modal
    :title="playerName"
    description="Win-Loss Index"
    fullscreen
  >
    <u-button
      label="Chart view"
      :icon="ICONS.barChart"
      size="sm"
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
