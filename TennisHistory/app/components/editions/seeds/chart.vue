<script setup lang="ts">
const { seeds } = defineProps<{ seeds: SeedType[] }>()
const {
  params: { year }
} = useRoute("edition")
const colorMode = useColorMode()

const tournamentName = useState("tournamentName")
const tours = useArrayUnique(seeds.map(seed => seed.tour)).value

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
      dimensions: ["draw", "seed", "rank", "team", "type", "tour"]
    },
    ...tours
      .map(tour => [
        {
          transform: {
            type: "filter",
            config: {
              and: [
                { dimension: "type", value: "Singles" },
                { dimension: "draw", value: "Main" },
                { dimension: "tour", value: tour }
              ]
            }
          }
        },
        {
          transform: {
            type: "filter",
            config: {
              and: [
                { dimension: "type", value: "Doubles" },
                { dimension: "draw", value: "Main" },
                { dimension: "tour", value: tour }
              ]
            }
          }
        },
        {
          transform: {
            type: "filter",
            config: {
              and: [
                { dimension: "type", value: "Singles" },
                { dimension: "draw", value: "Qualifying" },
                { dimension: "tour", value: tour }
              ]
            }
          }
        },
        {
          transform: {
            type: "filter",
            config: {
              and: [
                { dimension: "type", value: "Doubles" },
                { dimension: "draw", value: "Qualifying" },
                { dimension: "tour", value: tour }
              ]
            }
          }
        }
      ])
      .flat()
  ],
  tooltip: { trigger: "axis" },
  legend: {
    textStyle: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText },
    top: "top"
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
  series: tours
    .map((tour, index) => [
      {
        name: `Singles Main (${tour})`,
        type: "bar",
        encode: { x: "seed", y: "rank" },
        datasetIndex: index * 4 + 1
      },
      {
        name: `Doubles Main (${tour})`,
        type: "bar",
        encode: { x: "seed", y: "rank" },
        datasetIndex: index * 4 + 2
      },
      {
        name: `Singles Qualifying (${tour})`,
        type: "bar",
        encode: { x: "seed", y: "rank" },
        datasetIndex: index * 4 + 3
      },
      {
        name: `Doubles Qualifying (${tour})`,
        type: "bar",
        encode: { x: "seed", y: "rank" },
        datasetIndex: index * 4 + 4
      }
    ])
    .flat()
}))
</script>

<template>
  <u-modal
    :title="`${tournamentName} ${year}`"
    description="Seeds"
    fullscreen
  >
    <u-button :icon="ICONS.barChart" />

    <template #body>
      <v-chart
        class="min-h-200 w-full"
        :option
        :autoresize="true"
      />
    </template>
  </u-modal>
</template>
