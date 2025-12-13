<script setup lang="ts">
const { winners } = defineProps<{ winners: TournamentScoresStatsType[] }>()
const colorMode = useColorMode()

const tournamentName = useState<string>("tournamentName")
const tours = useArrayUnique(winners.map(winner => winner.tour)).value

const formattedWinners = computed(() =>
  winners.map(winner => ({
    ...winner,
    team: `${winner.team.map(player => `${player.first_name} ${player.last_name}`).join(" / ")} (${winner.year})`
  }))
)

const option = computed(() => ({
  backgroundColor: "transparent",
  textStyle: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText },
  grid: { containLabel: true },
  dataset: [
    {
      source: formattedWinners.value,
      dimensions: ["sets_won", "team", "tour", "type", "year", "sets_lost", "games_won", "games_lost"]
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
  xAxis: [
    {
      type: "value",
      axisLabel: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText },
      name: "Sets",
      splitLine: { show: false }
    },
    {
      type: "value",
      axisLabel: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText },
      name: "Games",
      splitLine: { show: false }
    }
  ],
  yAxis: {
    type: "category",
    inverse: true,
    axisLabel: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText }
  },
  tooltip: {
    trigger: "axis",
    axisPointer: { type: "shadow" }
  },
  legend: {
    textStyle: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText }
  },
  series: tours
    .map((tour, index) => [
      {
        name: `${tour} - Sets Wins`,
        type: "bar",
        encode: { x: "sets_won", y: "team" },
        stack: "sets",
        datasetIndex: index + 1,
        itemStyle: { color: COLOURS.orange600 }
      },
      {
        name: `${tour} - Sets Losses`,
        type: "bar",
        encode: { x: "sets_lost", y: "team" },
        stack: "sets",
        datasetIndex: index + 1,
        itemStyle: { color: COLOURS.orange300 }
      },
      {
        name: `${tour} - Games Wins`,
        type: "bar",
        encode: { x: "games_won", y: "team" },
        stack: "games",
        datasetIndex: index + 1,
        itemStyle: { color: COLOURS.indigo700 }
      },
      {
        name: `${tour} - Games Losses`,
        type: "bar",
        encode: { x: "games_lost", y: "team" },
        stack: "games",
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
    description="Winners by Age"
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
