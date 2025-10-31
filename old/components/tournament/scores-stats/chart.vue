<script setup lang="ts">
const { winners } = defineProps<{ winners: TournamentScoreStatsType[] }>()
const { icons, colours } = useAppConfig()
const tours = inject<TourType[]>("tours", [])
const tournamentName = inject<string>("tournamentName", "")
const colorMode = useColorMode()

const selectedTour = ref<TourType | null>(null)
const selectedType = ref<MatchType | null>(null)
const datasetIndex = ref(0)

watch([selectedTour, selectedType], () => {
  if (selectedTour.value && selectedType.value) {
    set(datasetIndex, 3)
  } else if (selectedTour.value) {
    set(datasetIndex, 2)
  } else if (selectedType.value) {
    set(datasetIndex, 1)
  } else {
    set(datasetIndex, 0)
  }
})

const formattedWinners = computed(() =>
  winners.map(winner => ({
    ...winner,
    team: `${winner.team.map(player => `${player.first_name} ${player.last_name}`).join(" / ")} (${winner.year})`
  }))
)

console.log(formattedWinners.value)

const option = computed(() => ({
  backgroundColor: "transparent",
  textStyle: { color: colorMode.value === "dark" ? colours.darkText : colours.lightText },
  grid: { containLabel: true },
  dataset: [
    {
      source: formattedWinners.value,
      dimensions: ["sets_won", "team", "tour", "type", "year", "sets_lost", "games_won", "games_lost"]
    },
    {
      transform: {
        type: "filter",
        config: { dimension: "type", value: selectedType.value }
      }
    },
    {
      transform: {
        type: "filter",
        config: { dimension: "tour", value: selectedTour.value }
      }
    },
    {
      transform: {
        type: "filter",
        config: {
          and: [
            { dimension: "type", value: selectedType.value },
            { dimension: "tour", value: selectedTour.value }
          ]
        }
      }
    }
  ],
  xAxis: [
    {
      type: "value",
      axisLabel: { color: colorMode.value === "dark" ? colours.darkText : colours.lightText },
      name: "Sets",
      splitLine: { show: false }
    },
    {
      type: "value",
      axisLabel: { color: colorMode.value === "dark" ? colours.darkText : colours.lightText },
      name: "Games",
      splitLine: { show: false }
    }
  ],
  yAxis: {
    type: "category",
    inverse: true,
    axisLabel: { color: colorMode.value === "dark" ? colours.darkText : colours.lightText }
  },
  tooltip: {
    trigger: "axis",
    axisPointer: { type: "shadow" }
  },
  series: [
    {
      name: "Sets Won",
      type: "bar",
      encode: { x: "sets_won", y: "team" },
      stack: "sets",
      datasetIndex: datasetIndex.value,
      itemStyle: { color: colours.orange600 },
      xAxisIndex: 0,
      barGap: "100%"
    },
    {
      name: "Sets Lost",
      type: "bar",
      encode: { x: "sets_lost", y: "team" },
      stack: "sets",
      datasetIndex: datasetIndex.value,
      itemStyle: { color: colours.orange300 },
      xAxisIndex: 0,
      label: {
        show: true,
        formatter: ({ data }: any) => `${percentage(data.sets_won, data.sets_won + data.sets_lost)}%`,
        position: "right",
        color: colorMode.value === "dark" ? colours.darkText : colours.lightText
      },
      barGap: "100%"
    },
    {
      name: "Games Won",
      type: "bar",
      encode: { x: "games_won", y: "team" },
      stack: "games",
      datasetIndex: datasetIndex.value,
      itemStyle: { color: colours.indigo700 },
      xAxisIndex: 1,
      barGap: "100%"
    },
    {
      name: "Games Lost",
      type: "bar",
      encode: { x: "games_lost", y: "team" },
      stack: "games",
      datasetIndex: datasetIndex.value,
      itemStyle: { color: colours.indigo300 },
      xAxisIndex: 1,
      label: {
        show: true,
        formatter: ({ data }: any) => `${percentage(data.games_won, data.games_won + data.games_lost)}%`,
        position: "right",
        color: colorMode.value === "dark" ? colours.darkText : colours.lightText
      },
      barGap: "100%"
    }
  ]
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
      :icon="icons.barChart"
    />

    <template #body>
      <div class="flex w-full items-center justify-between">
        <u-radio-group
          v-if="tours.length > 1"
          legend="Tour"
          v-model="selectedTour"
          :items="[{ label: 'All', value: null }, ...tours.map(tour => ({ label: tour, value: tour }))]"
          orientation="horizontal"
        />
        <u-radio-group
          legend="Match Type"
          v-model="selectedType"
          :items="[
            { label: 'All', value: null },
            { label: 'Singles', value: 'Singles' },
            { label: 'Doubles', value: 'Doubles' }
          ]"
          orientation="horizontal"
        />
      </div>
      <div class="flex gap-2">
        <v-chart
          class="min-h-200 w-full"
          :option
          :autoresize="true"
        />
        <div
          class="flex flex-col gap-1 max-h-150 overflow-y-auto my-auto scrollbar-thin scrollbar-thumb-primary-600 scrollbar-track-transparent text-sm shrink-0"
        >
          <!-- <div
            v-for="[player, colour] in Object.entries(playerColourMap)"
            :key="player"
            class="flex items-center gap-2"
          >
            <u-icon
              :name="icons.colours"
              :style="{ color: colour }"
            />
            <span class="mr-5">{{ player }}</span>
          </div>-->
        </div>
      </div>
    </template>
  </u-modal>
</template>
