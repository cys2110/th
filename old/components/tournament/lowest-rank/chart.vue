<script setup lang="ts">
const { events } = defineProps<{ events: TournamentLowestRankedType[] }>()
const { icons, colours } = useAppConfig()
const tours = inject<TourType[]>("tours", [])
const tournamentName = inject<string>("tournamentName", "")
const colorMode = useColorMode()

const formattedEvents = computed(() =>
  events.map(event => ({
    ...event,
    player: `${event.player.first_name} ${event.player.last_name}`
  }))
)

const option = computed(() => ({
  backgroundColor: "transparent",
  textStyle: { color: colorMode.value === "dark" ? colours.darkText : colours.lightText },
  grid: { containLabel: true },
  dataset: [
    {
      source: formattedEvents.value,
      dimensions: ["id", "player", "tour", "type", "year", "rank", "round"]
    },
    ...tours.map(tour => ({
      transform: {
        type: "filter",
        config: {
          and: [
            { dimension: "tour", value: tour },
            { dimension: "type", value: "Singles" }
          ]
        }
      }
    })),
    ...tours.map(tour => ({
      transform: {
        type: "filter",
        config: {
          and: [
            { dimension: "tour", value: tour },
            { dimension: "type", value: "Doubles" }
          ]
        }
      }
    }))
  ],
  xAxis: {
    type: "category",
    axisLabel: { color: colorMode.value === "dark" ? colours.darkText : colours.lightText },
    name: "Round"
  },
  yAxis: {
    type: "value",
    axisLabel: { color: colorMode.value === "dark" ? colours.darkText : colours.lightText },
    name: "Lowest Rank"
  },
  tooltip: {
    trigger: "axis",
    axisPointer: { type: "shadow" }
  },
  legend: {
    textStyle: { color: colorMode.value === "dark" ? colours.darkText : colours.lightText },
    top: "middle",
    right: "right"
  },
  series: [
    ...tours.map((tour, index) => ({
      name: `${tour} Singles`,
      type: "bar",
      encode: { x: "round", y: "rank" },
      itemStyle: { color: index === 0 ? colours.emerald700 : colours.fuchsia300, borderRadius: [25, 25, 0, 0] },
      datasetIndex: index + 1
    })),
    ...tours.map((tour, index) => ({
      name: `${tour} Doubles`,
      type: "bar",
      encode: { x: "round", y: "rank" },
      itemStyle: { color: index === 0 ? colours.indigo700 : colours.amber300, borderRadius: [25, 25, 0, 0] },
      datasetIndex: index + tours.length + 1
    }))
  ]
}))
</script>

<template>
  <u-modal
    :title="tournamentName"
    description="Lowest Ranked Player to Reach Later Rounds"
    fullscreen
  >
    <u-button
      label="Chart"
      :icon="icons.barChart"
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
