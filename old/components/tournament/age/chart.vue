<script setup lang="ts">
const { winners } = defineProps<{ winners: TournamentAgeType[] }>()
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

const playerColourMap = computed(() => {
  const uniquePlayers = [...new Set(winners.map(winner => `${winner.player.first_name} ${winner.player.last_name}`))]

  return Object.fromEntries(uniquePlayers.map((player, index) => [player, getColour(index)]))
})

const formattedWinners = computed(() =>
  winners.map(winner => ({
    ...winner,
    player: `${winner.player.first_name} ${winner.player.last_name}`,
    colour: playerColourMap.value[`${winner.player.first_name} ${winner.player.last_name}`],
    stringAge: winner.age ? getAge(winner.age) : "—",
    age: winner.age ? winner.age.months * 30.4375 + winner.age?.days : Infinity,
    tour: winner.player.tour
  }))
)

const option = computed(() => ({
  backgroundColor: "transparent",
  textStyle: { color: colorMode.value === "dark" ? colours.darkText : colours.lightText },
  grid: { containLabel: true },
  dataset: [
    {
      source: formattedWinners.value,
      dimensions: ["age", "player", "tour", "type", "year", "colour"]
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
  radiusAxis: {
    type: "category",
    axisLabel: { show: false }
  },
  polar: { radius: [30, "80%"] },
  angleAxis: {
    axisLabel: {
      formatter: function (value: number) {
        const years = Math.floor(value / 365.25)
        const months = Math.floor((value % 365.25) / 30.4375)
        const days = Math.floor(value % 30.4375)
        return `${years}y ${months}m ${days}d`
      }
    }
  },
  tooltip: {
    formatter: (params: any) => {
      return `
        <div class="flex flex-col">
          <div class="flex justify-between font-semibold">
            <div class="flex items-center gap-1">
              <span>${params.marker}</span>
              <span>${params.data.tour}</span>
            </div>
            <span>${params.data.type}</span>
          </div>
          <div class="flex justify-between font-bold">
            <span>${params.data.player}</span>
            <span>${params.data.year}</span>
          </div>
          <span>${params.data.stringAge}</span>
        </div>
      `
    }
  },
  series: {
    type: "bar",
    encode: { radius: "player", angle: "age" },
    coordinateSystem: "polar",
    itemStyle: { color: ({ data }: any) => data.colour },
    roundCap: true,
    datasetIndex: datasetIndex.value
  }
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
      :icon="icons.polarChart"
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
          <div
            v-for="[player, colour] in Object.entries(playerColourMap)"
            :key="player"
            class="flex items-center gap-2"
          >
            <u-icon
              :name="icons.colours"
              :style="{ color: colour }"
            />
            <span class="mr-5">{{ player }}</span>
          </div>
        </div>
      </div>
    </template>
  </u-modal>
</template>
