<script setup lang="ts">
const { winners } = defineProps<{ winners: TournamentAgeType[] }>()
const colorMode = useColorMode()

const tournamentName = useState<string>("tournamentName")
const tours = useArrayUnique(winners.map(winner => winner.tour)).value

const playerColourMap = computed(() => {
  const uniquePlayers = [...new Set(winners.map(winner => `${winner.first_name} ${winner.last_name}`))]

  return Object.fromEntries(uniquePlayers.map((player, index) => [player, getColour(index)]))
})

const formattedWinners = computed(() =>
  winners.map(winner => {
    const years = Math.floor(winner.age.months / 12)
    const months = winner.age.months % 12
    const days = winner.age.days

    return {
      ...winner,
      player: `${winner.first_name} ${winner.last_name}`,
      colour: playerColourMap.value[`${winner.first_name} ${winner.last_name}`],
      stringAge: winner.age ? `${years}y ${months}m ${days}d` : "—",
      age: winner.age ? winner.age.months * 30.4375 + winner.age?.days : Infinity,
      tour: winner.tour
    }
  })
)

const option = computed(() => ({
  backgroundColor: "transparent",
  textStyle: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText },
  grid: { containLabel: true },
  dataset: [
    {
      source: formattedWinners.value,
      dimensions: ["age", "player", "tour", "type", "year", "colour"]
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
          <div class="flex justify-between font-bold gap-5">
            <span>${params.data.player}</span>
            <span>${params.data.year}</span>
          </div>
          <span>${params.data.stringAge}</span>
        </div>
      `
    }
  },
  series: tours.map((tour, index) => ({
    type: "bar",
    encode: { radius: "player", angle: "age" },
    coordinateSystem: "polar",
    itemStyle: { color: ({ data }: any) => data.colour },
    roundCap: true,
    datasetIndex: index + 1
  }))
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
      :icon="ICONS.polarChart"
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
