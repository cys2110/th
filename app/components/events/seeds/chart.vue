<script setup lang="ts">
const { seeds } = defineProps<{ seeds: SeedType[] }>()
const {
  params: { year, tour }
} = useRoute("event")
const colorMode = useColorMode()
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
      dimensions: ["draw", "seed", "rank", "team", "type"]
    },
    {
      transform: {
        type: "filter",
        config: {
          and: [
            { dimension: "type", value: "Singles" },
            { dimension: "draw", value: "Main" }
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
            { dimension: "draw", value: "Main" }
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
            { dimension: "draw", value: "Qualifying" }
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
            { dimension: "draw", value: "Qualifying" }
          ]
        }
      }
    }
  ],
  tooltip: { trigger: "item" },
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
    {
      name: "Singles Main",
      type: "bar",
      encode: { x: "seed", y: "rank" },
      datasetIndex: 1
    },
    {
      name: "Doubles Main",
      type: "bar",
      encode: { x: "seed", y: "rank" },
      datasetIndex: 2
    },
    {
      name: "Singles Qualifying",
      type: "bar",
      encode: { x: "seed", y: "rank" },
      datasetIndex: 3
    },
    {
      name: "Doubles Qualifying",
      type: "bar",
      encode: { x: "seed", y: "rank" },
      datasetIndex: 4
    }
  ]
}))
</script>

<template>
  <u-modal
    :title="`${tournamentName} ${year} ${tour}`"
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
