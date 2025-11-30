<script setup lang="ts">
const { awards } = defineProps<{ awards: AwardType[] }>()

const {
  params: { name, year, tour }
} = useRoute("event")
const colorMode = useColorMode()
const tournamentName = useState("tournament-name")

const option = computed(() => ({
  backgroundColor: "transparent",
  textStyle: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText },
  grid: { containLabel: true },
  dataset: [
    {
      source: awards,
      dimensions: ["round", "points", "pm", "currency", "type"]
    },
    {
      transform: {
        type: "filter",
        config: { dimension: "type", value: "Singles" }
      }
    },
    {
      transform: {
        type: "filter",
        config: { dimension: "type", value: "Doubles" }
      }
    }
  ],
  tooltip: {
    trigger: "axis"
  },
  legend: {
    textStyle: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText },
    top: "middle",
    right: "right"
  },
  xAxis: {
    type: "category",
    inverse: true,
    axisLabel: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText }
  },
  yAxis: [
    {
      type: "value",
      name: `Prize Money (${awards[0]?.currency || "$"})`,
      axisLabel: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText }
    },
    {
      type: "value",
      name: "Points",
      splitLine: { show: false },
      axisLabel: {
        formatter: (value: number) => value.toLocaleString("en-GB"),
        color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText
      }
    }
  ],
  series: [
    {
      name: "Singles Prize Money",
      type: "line",
      encode: { x: "round", y: "pm" },
      yAxisIndex: 0,
      datasetIndex: 1,
      tooltip: {
        valueFormatter: (value: number) => value.toLocaleString("en-GB", { style: "currency", currency: awards[0]?.currency || "USD" })
      }
    },
    {
      name: "Singles Points",
      type: "scatter",
      encode: { x: "round", y: "points" },
      yAxisIndex: 1,
      datasetIndex: 1,
      symbol: "diamond"
    },
    {
      name: "Doubles Prize Money",
      type: "line",
      encode: { x: "round", y: "pm" },
      yAxisIndex: 0,
      datasetIndex: 2,
      tooltip: {
        valueFormatter: (value: number) => value.toLocaleString("en-GB", { style: "currency", currency: awards[0]?.currency || "USD" })
      }
    },
    {
      name: "Doubles Points",
      type: "scatter",
      encode: { x: "round", y: "points" },
      yAxisIndex: 1,
      datasetIndex: 2,
      symbol: "diamond"
    }
  ]
}))
</script>

<template>
  <u-modal
    :title="`${tournamentName} ${year} ${tour}`"
    description="Awards"
    fullscreen
  >
    <u-button :icon="ICONS.scatterChart" />

    <template #body>
      <v-chart
        class="min-h-200 w-full"
        :option
        :autoresize="true"
      />
    </template>
  </u-modal>
</template>
