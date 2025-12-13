<script setup lang="ts">
const { finalists } = defineProps<{ finalists: TournamentFinalistType[] }>()
const colorMode = useColorMode()

const tournamentName = useState<string>("tournamentName")
const tours = useArrayUnique(finalists.map(finalist => finalist.tour)).value

const formattedFinalists = computed(() =>
  finalists.map(finalist => ({
    ...finalist,
    player: `${finalist.first_name} ${finalist.last_name}`
  }))
)

const option = computed(() => ({
  backgroundColor: "transparent",
  textStyle: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText },
  grid: { containLabel: true },
  tooltip: {
    trigger: "axis",
    axisPointer: { type: "shadow" }
  },
  dataset: [
    {
      source: formattedFinalists.value,
      dimensions: ["player", "finals", "singles_wins", "singles_losses", "doubles_wins", "doubles_losses", "tour"]
    },
    ...tours.map(tour => ({
      transform: {
        type: "filter",
        config: {
          dimension: "tour",
          value: tour
        }
      }
    }))
  ],
  xAxis: {
    type: "value",
    axisLabel: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText }
  },
  yAxis: {
    type: "category",
    inverse: true,
    axisLabel: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText }
  },
  legend: {
    textStyle: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText }
  },
  series: tours
    .map((tour, index) => [
      {
        name: `${tour} - Singles Wins`,
        type: "bar",
        encode: { x: "singles_wins", y: "player" },
        stack: "singles",
        datasetIndex: index + 1,
        itemStyle: { color: COLOURS.orange600 }
      },
      {
        name: `${tour} - Singles Losses`,
        type: "bar",
        encode: { x: "singles_losses", y: "player" },
        stack: "singles",
        datasetIndex: index + 1,
        itemStyle: { color: COLOURS.orange300 }
      },
      {
        name: `${tour} - Doubles Wins`,
        type: "bar",
        encode: { x: "doubles_wins", y: "player" },
        stack: "doubles",
        datasetIndex: index + 1,
        itemStyle: { color: COLOURS.indigo700 }
      },
      {
        name: `${tour} - Doubles Losses`,
        type: "bar",
        encode: { x: "doubles_losses", y: "player" },
        stack: "doubles",
        datasetIndex: index + 1,
        itemStyle: { color: COLOURS.indigo300 }
      }
    ])
    .flat()
}))
</script>

<template>
  <u-modal
    :title="tournamentName"
    description="Players by Number of Finals"
    fullscreen
  >
    <u-button
      label="Chart"
      :icon="ICONS.barChart"
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
