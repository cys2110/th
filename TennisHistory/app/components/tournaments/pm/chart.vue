<script setup lang="ts">
const { rounds } = defineProps<{ rounds: TournamentPmType[] }>()
const colorMode = useColorMode()

const tournamentName = useState<string>("tournamentName")
const tours = useArrayUnique(rounds.map(round => round.tour)).value

const selectedTour = ref(tours[0] ?? "ATP")
const selectedType = ref<MatchTypeEnumType>("Singles")

const roundNames = useArrayUnique(rounds.sort((a, b) => b.number - a.number).map(round => round.round))

const roundColourMapping = {
  "Qualifying round 1": {
    line: COLOURS.fuchsia600,
    area: COLOURS.fuchsia300,
    scatter: COLOURS.red300
  },
  "Qualifying round 2": {
    line: COLOURS.purple600,
    area: COLOURS.purple300,
    scatter: COLOURS.violet700
  },
  Qualifier: {
    line: COLOURS.amber600,
    area: COLOURS.amber300,
    scatter: COLOURS.orange600
  },
  "Round of 128": {
    line: COLOURS.lime500,
    area: COLOURS.lime300,
    scatter: COLOURS.green600
  },
  "Round of 64": {
    line: COLOURS.rose700,
    area: COLOURS.rose300,
    scatter: COLOURS.fuchsia600
  },
  "Round of 32": {
    line: COLOURS.sky700,
    area: COLOURS.sky300,
    scatter: COLOURS.blue700
  },
  "Round of 16": {
    line: COLOURS.orange600,
    area: COLOURS.orange300,
    scatter: COLOURS.red700
  },
  Quarterfinals: {
    line: COLOURS.violet700,
    area: COLOURS.violet300,
    scatter: COLOURS.purple300
  },
  Semifinals: {
    line: COLOURS.indigo700,
    area: COLOURS.indigo300,
    scatter: COLOURS.cyan300
  },
  Final: {
    line: COLOURS.yellow600,
    area: COLOURS.yellow300,
    scatter: COLOURS.orange600
  },
  Win: {
    line: COLOURS.emerald700,
    area: COLOURS.emerald300,
    scatter: COLOURS.lime300
  }
}

const option = computed(() => ({
  backgroundColor: "transparent",
  textStyle: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText },
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
    textStyle: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText }
  },
  tooltip: {
    trigger: "item",
    axisPointer: {
      type: "cross",
      label: {
        backgroundColor: colorMode.value === "dark" ? COLOURS.lightText : COLOURS.darkText
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
      :icon="ICONS.areaChart"
    />

    <template #body>
      <div class="flex w-full items-center justify-between">
        <u-radio-group
          v-if="tours.length > 1"
          legend="Tour"
          v-model="selectedTour"
          :items="tours"
          orientation="horizontal"
        />
        <u-radio-group
          legend="S/D"
          v-model="selectedType"
          :items="['Singles', 'Doubles']"
          orientation="horizontal"
        />
      </div>

      <v-chart
        class="min-h-150 w-full my-5"
        :option
        :autoresize="true"
      />
    </template>
  </u-modal>
</template>
