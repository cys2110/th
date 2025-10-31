<script setup lang="ts">
const { seeds } = defineProps<{ seeds: SeedInterface[] }>()
const {
  params: { year }
} = useRoute("event")
const colorMode = useColorMode()
const tours = useState<TourType[]>("tours")
const tournamentName = useState<string>("tournament-name")

const formattedSeeds = seeds.map(seed => ({
  ...seed,
  team: seed.team.map(player => `${player.first_name} ${player.last_name}`).join(" / ")
}))

const option = computed(() => ({
  backgroundColor: "transparent",
  textStyle: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText },
  grid: { containLabel: true },
  dataset: [
    {
      source: formattedSeeds,
      dimensions: ["draw", "seed", "rank", "team", "tour", "type"]
    },
    ...tours.value.map(tour => ({
      transform: {
        type: "filter",
        config: {
          and: [
            { dimension: "type", value: "Singles" },
            { dimension: "tour", value: tour },
            { dimension: "draw", value: "Main" }
          ]
        }
      }
    })),
    ...tours.value.map(tour => ({
      transform: {
        type: "filter",
        config: {
          and: [
            { dimension: "type", value: "Doubles" },
            { dimension: "tour", value: tour },
            { dimension: "draw", value: "Main" }
          ]
        }
      }
    })),
    ...tours.value.map(tour => ({
      transform: {
        type: "filter",
        config: {
          and: [
            { dimension: "type", value: "Singles" },
            { dimension: "tour", value: tour },
            { dimension: "draw", value: "Qualifying" }
          ]
        }
      }
    })),
    ...tours.value.map(tour => ({
      transform: {
        type: "filter",
        config: {
          and: [
            { dimension: "type", value: "Doubles" },
            { dimension: "tour", value: tour },
            { dimension: "draw", value: "Qualifying" }
          ]
        }
      }
    }))
  ],
  tooltip: {
    trigger: "item"
  },
  legend: {
    textStyle: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText },
    top: "middle",
    right: "right"
  },
  xAxis: {
    type: "category",
    axisLabel: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText }
  },
  yAxis: {
    type: "value",
    name: "Rank at draw",
    splitLine: { show: false },
    axisLabel: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText }
  },
  series: [
    ...tours.value.map((tour, index) => ({
      name: `${tour} Singles Main`,
      type: "bar",
      encode: { x: "seed", y: "rank" },
      datasetIndex: index + 1
    })),
    ...tours.value.map((tour, index) => ({
      name: `${tour} Doubles Main`,
      type: "bar",
      encode: { x: "seed", y: "rank" },
      datasetIndex: index + tours.value.length + 1
    })),
    ...tours.value.map((tour, index) => ({
      name: `${tour} Singles Qualifying`,
      type: "bar",
      encode: { x: "seed", y: "rank" },
      datasetIndex: index + 2 * tours.value.length + 1
    })),
    ...tours.value.map((tour, index) => ({
      name: `${tour} Doubles Qualifying`,
      type: "bar",
      encode: { x: "seed", y: "rank" },
      datasetIndex: index + 3 * tours.value.length + 1
    }))
  ]
}))
</script>

<template>
  <u-modal
    :title="`${tournamentName} ${year}`"
    description="Seeds"
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
