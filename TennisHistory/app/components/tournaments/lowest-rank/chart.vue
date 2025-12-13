<script setup lang="ts">
const { events } = defineProps<{ events: TournamentLowestRankedType[] }>()
const colorMode = useColorMode()

const tournamentName = useState<string>("tournamentName")
const tours = useArrayUnique(events.map(event => event.tour)).value

const formattedEvents = computed(() =>
  events.map(event => ({
    ...event,
    player: `${event.first_name} ${event.last_name}`
  }))
)

const option = computed(() => ({
  backgroundColor: "transparent",
  textStyle: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText },
  grid: { containLabel: true },
  dataset: [
    {
      source: formattedEvents.value,
      dimensions: ["id", "player", "tour", "year", "rank", "round"]
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
    type: "category",
    axisLabel: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText },
    name: "Round"
  },
  yAxis: {
    type: "value",
    axisLabel: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText },
    name: "Lowest Rank"
  },
  tooltip: {
    trigger: "axis",
    axisPointer: { type: "shadow" }
  },
  legend: {
    textStyle: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText },
    top: "middle",
    right: "right"
  },
  series: tours.map((tour, index) => ({
    name: tour,
    type: "bar",
    encode: { x: "round", y: "rank" },
    itemStyle: { color: index === 0 ? COLOURS.emerald700 : COLOURS.fuchsia300, borderRadius: [25, 25, 0, 0] },
    datasetIndex: index + 1,
    label: {
      show: true,
      color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText,
      formatter: "{@player} - {@year}"
    }
  }))
}))
</script>

<template>
  <u-modal
    :title="tournamentName"
    description="Lowest Ranked Singles Player to Reach Later Rounds"
    fullscreen
  >
    <u-button
      :icon="ICONS.barChart"
      label="Chart"
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
