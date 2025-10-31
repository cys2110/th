<script setup lang="ts">
const { rounds } = defineProps<{ rounds: TournamentPmType[] }>()
const { icons, colours } = useAppConfig()
const tours = inject<TourType[]>("tours", [])
const tournamentName = inject<string>("tournamentName", "")
const colorMode = useColorMode()

const selectedTour = ref<TourType>(tours[0] ?? "ATP")
const selectedType = ref<MatchType>("Singles")

const roundNames = useArrayUnique(rounds.sort((a, b) => b.number - a.number).map(round => round.round))

const roundColourMapping = {
  "Qualifying round 1": {
    line: colours.fuchsia600,
    area: colours.fuchsia300,
    scatter: colours.red300
  },
  "Qualifying round 2": {
    line: colours.purple600,
    area: colours.purple300,
    scatter: colours.violet700
  },
  Qualifier: {
    line: colours.amber600,
    area: colours.amber300,
    scatter: colours.orange600
  },
  "Round of 128": {
    line: colours.lime500,
    area: colours.lime300,
    scatter: colours.green600
  },
  "Round of 64": {
    line: colours.rose700,
    area: colours.rose300,
    scatter: colours.fuchsia600
  },
  "Round of 32": {
    line: colours.sky700,
    area: colours.sky300,
    scatter: colours.blue700
  },
  "Round of 16": {
    line: colours.orange600,
    area: colours.orange300,
    scatter: colours.red700
  },
  Quarterfinals: {
    line: colours.violet700,
    area: colours.violet300,
    scatter: colours.purple300
  },
  Semifinals: {
    line: colours.indigo700,
    area: colours.indigo300,
    scatter: colours.cyan300
  },
  Final: {
    line: colours.yellow600,
    area: colours.yellow300,
    scatter: colours.orange600
  },
  Win: {
    line: colours.emerald700,
    area: colours.emerald300,
    scatter: colours.lime300
  }
}

const option = computed(() => ({
  backgroundColor: "transparent",
  textStyle: { color: colorMode.value === "dark" ? colours.darkText : colours.lightText },
  grid: { containLabel: true },
  dataset: [
    {
      source: rounds,
      dimensions: ["id", "pm", "number", "round", "year", "points", "type", "tour", "currency"]
    },
    ...roundNames.value.map(round => ({
      transform: {
        type: "filter",
        config: {
          and: [
            { dimension: "round", value: round },
            { dimension: "tour", value: selectedTour.value },
            { dimension: "type", value: selectedType.value }
          ]
        }
      }
    }))
  ],
  legend: {
    textStyle: { color: colorMode.value === "dark" ? colours.darkText : colours.lightText },
    top: "top"
  },
  tooltip: {
    trigger: "item",
    axisPointer: {
      type: "cross",
      label: {
        backgroundColor: colorMode.value === "dark" ? colours.lightText : colours.darkText
      }
    },
    textStyle: {
      fontWeight: "bold"
    }
  },
  xAxis: {
    type: "category",
    name: "Year",
    boundaryGap: false,
    nameLocation: "center",
    nameGap: 30,
    inverse: true
  },
  yAxis: [
    {
      type: "value",
      name: "Prize Money",
      axisLabel: {
        formatter: (value: number) => {
          const currency = rounds.find(round => round.tour === selectedTour.value)?.currency
          return currency ? value.toLocaleString("en-GB", { style: "currency", currency }) : value
        }
      }
    },
    {
      type: "value",
      name: "Points",
      splitLine: { show: false }
    }
  ],
  series: [
    ...roundNames.value.map((round, index) => ({
      name: `${round} Prize Money`,
      type: "line",
      smooth: true,
      stack: "Pm",
      itemStyle: {
        color: roundColourMapping[round as keyof typeof roundColourMapping].line
      },
      areaStyle: {
        color: roundColourMapping[round as keyof typeof roundColourMapping].area,
        opacity: 0.25
      },
      emphasis: { focus: "series" },
      encode: { x: "year", y: "pm" },
      yAxisIndex: 0,
      datasetIndex: index + 1,
      tooltip: {
        valueFormatter: (value: number) => {
          const currency = rounds.find(round => round.tour === selectedTour.value)?.currency
          return currency ? value.toLocaleString("en-GB", { style: "currency", currency }) : value
        }
      }
    })),
    ...roundNames.value.map((round, index) => ({
      name: `${round} Points`,
      type: "scatter",
      smooth: true,
      encode: { x: "year", y: "points" },
      yAxisIndex: 1,
      itemStyle: {
        color: roundColourMapping[round as keyof typeof roundColourMapping].scatter
      },
      symbol: "diamond",
      zLevel: 3,
      datasetIndex: index + 1
    }))
  ]
}))
</script>

<template>
  <u-modal
    :title="tournamentName"
    description="Historical Prize Money"
    fullscreen
  >
    <u-button
      label="Chart"
      :icon="icons.areaChart"
    />

    <template #body>
      <div class="flex w-full items-center justify-between">
        <filter-radio-tour
          v-model="selectedTour"
          :tours
          size="md"
        />
        <filter-radio-match-type
          v-model="selectedType"
          size="md"
        />
      </div>

      <v-chart
        class="min-h-200 w-full my-5"
        :option
        :autoresize="true"
      />
    </template>
  </u-modal>
</template>
