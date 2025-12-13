<script setup lang="ts">
const { awards } = defineProps<{ awards: AwardType[] }>()

const {
  params: { year }
} = useRoute("edition")
const colorMode = useColorMode()

const tournamentName = useState("tournamentName")
const tours = useArrayUnique(awards.map(award => award.tour)).value

const option = computed(() => ({
  backgroundColor: "transparent",
  textStyle: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText },
  grid: { containLabel: true },
  dataset: [
    {
      source: awards,
      dimensions: ["round", "points", "pm", "currency", "type", "tour"]
    },
    ...tours
      .map(tour => [
        {
          transform: {
            type: "filter",
            config: {
              and: [
                { dimension: "tour", value: tour },
                { dimension: "type", value: "Singles" }
              ]
            }
          }
        },
        {
          transform: {
            type: "filter",
            config: {
              and: [
                { dimension: "tour", value: tour },
                { dimension: "type", value: "Doubles" }
              ]
            }
          }
        }
      ])
      .flat()
  ],
  tooltip: {
    trigger: "axis"
  },
  legend: {
    textStyle: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText },
    top: "top"
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
  series: tours
    .map((tour, index) => [
      {
        name: `Singles Prize Money (${tour})`,
        type: "line",
        encode: { x: "round", y: "pm" },
        yAxisIndex: 0,
        datasetIndex: index * 2 + 1,
        tooltip: {
          valueFormatter: (value: number) => value.toLocaleString("en-GB", { style: "currency", currency: awards[0]?.currency || "USD" })
        }
      },
      {
        name: `Singles Points (${tour})`,
        type: "scatter",
        encode: { x: "round", y: "points" },
        yAxisIndex: 1,
        datasetIndex: index * 2 + 1,
        symbol: "diamond"
      },
      {
        name: `Doubles Prize Money (${tour})`,
        type: "line",
        encode: { x: "round", y: "pm" },
        yAxisIndex: 0,
        datasetIndex: index * 2 + 2,
        tooltip: {
          valueFormatter: (value: number) => value.toLocaleString("en-GB", { style: "currency", currency: awards[0]?.currency || "USD" })
        }
      },
      {
        name: `Doubles Points (${tour})`,
        type: "scatter",
        encode: { x: "round", y: "points" },
        yAxisIndex: 1,
        datasetIndex: index * 2 + 2,
        symbol: "diamond"
      }
    ])
    .flat()
}))
</script>

<template>
  <u-modal
    :title="`${tournamentName} ${year}`"
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
