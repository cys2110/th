<script setup lang="ts">
const { icons, colours } = useAppConfig()
const {
  params: { id }
} = useRoute("tournament")
const tours = inject<TourType[]>("tours", [])
const tournamentName = inject<string>("tournamentName", "")
const colorMode = useColorMode()

interface APIResponse {
  country: string
  year: string
  player: string
  tour: TourType
  type: MatchType
}

// API call
const { data: countries } = await useFetch<APIResponse[]>("/api/tournaments/country-chart", {
  key: `tournament-country-chart-${id}`,
  query: { id },
  default: () => [],
  server: false
})

interface CountryAgg {
  country: string
  year: string
  players: string[]
  atp_singles_wins: number
  atp_doubles_wins: number
  wta_singles_wins: number
  wta_doubles_wins: number
  total_atp_singles_wins: number
  total_atp_doubles_wins: number
  total_wta_singles_wins: number
  total_wta_doubles_wins: number
  distinct_singles: number
  total_singles: number
  distinct_doubles: number
  total_doubles: number
  distinct_atp: number
  total_atp: number
  distinct_wta: number
  total_wta: number
  distinct: number
  total: number
}

const uniqueCountries = useArrayUnique(countries.value.map(c => c.country)).value.sort()

const formattedCountry = computed<CountryAgg[]>(() => {
  const uniqueYears = useArrayUnique(countries.value.map(c => c.year)).value.sort()

  const data: CountryAgg[] = []

  uniqueYears.forEach(year => {
    uniqueCountries.forEach(country => {
      const wins = countries.value.filter(c => c.year === year && c.country === country)

      if (wins.length) {
        const atp_singles_wins = wins.filter(w => w.type === "Singles" && w.tour === "ATP")
        const atp_doubles_wins = wins.filter(w => w.type === "Doubles" && w.tour === "ATP")
        const wta_singles_wins = wins.filter(w => w.type === "Singles" && w.tour === "WTA")
        const wta_doubles_wins = wins.filter(w => w.type === "Doubles" && w.tour === "WTA")

        if (data.some(d => d.country === country)) {
          const lastCountryEntry = useArrayFindLast(data, d => d.country === country).value!

          const thisYearPlayers = useArrayUnique(wins.map(w => `${w.player}-${w.type}`)).value

          const seen = new Set(lastCountryEntry.players)

          const newAtpSinglesWins = atp_singles_wins.length && !seen.has(`${atp_singles_wins[0]!.player}-Singles`) ? 1 : 0
          const newWtaSinglesWins = wta_singles_wins.length && !seen.has(`${wta_singles_wins[0]!.player}-Singles`) ? 1 : 0
          const newAtpDoublesWins = atp_doubles_wins.length && !seen.has(`${atp_doubles_wins[0]!.player}-Doubles`) ? 1 : 0
          const newWtaDoublesWins = wta_doubles_wins.length && !seen.has(`${wta_doubles_wins[0]!.player}-Doubles`) ? 1 : 0

          const players = useArrayUnique([...lastCountryEntry.players, ...thisYearPlayers]).value

          data.push({
            country,
            year,
            players,
            atp_singles_wins: newAtpSinglesWins + lastCountryEntry.atp_singles_wins,
            atp_doubles_wins: newAtpDoublesWins + lastCountryEntry.atp_doubles_wins,
            wta_singles_wins: newWtaSinglesWins + lastCountryEntry.wta_singles_wins,
            wta_doubles_wins: newWtaDoublesWins + lastCountryEntry.wta_doubles_wins,

            total_atp_singles_wins: atp_singles_wins.length + lastCountryEntry.total_atp_singles_wins,
            total_atp_doubles_wins: atp_doubles_wins.length + lastCountryEntry.total_atp_doubles_wins,
            total_wta_singles_wins: wta_singles_wins.length + lastCountryEntry.total_wta_singles_wins,
            total_wta_doubles_wins: wta_doubles_wins.length + lastCountryEntry.total_wta_doubles_wins,

            distinct_singles: newAtpSinglesWins + newWtaSinglesWins + lastCountryEntry.distinct_singles,
            total_singles: atp_singles_wins.length + wta_singles_wins.length + lastCountryEntry.total_singles,

            distinct_doubles: newAtpDoublesWins + newWtaDoublesWins + lastCountryEntry.distinct_doubles,
            total_doubles: atp_doubles_wins.length + wta_doubles_wins.length + lastCountryEntry.total_doubles,

            distinct_atp: newAtpSinglesWins + newAtpDoublesWins + lastCountryEntry.distinct_atp,
            total_atp: atp_singles_wins.length + atp_doubles_wins.length + lastCountryEntry.total_atp,

            distinct_wta: newWtaSinglesWins + newWtaDoublesWins + lastCountryEntry.distinct_wta,
            total_wta: wta_singles_wins.length + wta_doubles_wins.length + lastCountryEntry.total_wta,

            distinct: newAtpSinglesWins + newAtpDoublesWins + newWtaSinglesWins + newWtaDoublesWins + lastCountryEntry.distinct,
            total: atp_singles_wins.length + atp_doubles_wins.length + wta_singles_wins.length + wta_doubles_wins.length + lastCountryEntry.total
          })
        } else {
          const players = useArrayUnique(wins.map(w => `${w.player}-${w.type}`)).value

          const distinctSingles = useArrayUnique(wins.filter(w => w.type === "Singles").map(w => `${w.player}-Singles`)).value.length
          const distinctDoubles = useArrayUnique(wins.filter(w => w.type === "Doubles").map(w => `${w.player}-Doubles`)).value.length
          const distinctAtp = useArrayUnique(wins.filter(w => w.tour === "ATP").map(w => `${w.player}-${w.type}`)).value.length
          const distinctWta = useArrayUnique(wins.filter(w => w.tour === "WTA").map(w => `${w.player}-${w.type}`)).value.length

          data.push({
            country,
            year,
            players,
            atp_singles_wins: useArrayUnique(atp_singles_wins.map(w => `${w.player}-Singles`)).value.length,
            atp_doubles_wins: useArrayUnique(atp_doubles_wins.map(w => `${w.player}-Doubles`)).value.length,
            wta_singles_wins: useArrayUnique(wta_singles_wins.map(w => `${w.player}-Singles`)).value.length,
            wta_doubles_wins: useArrayUnique(wta_doubles_wins.map(w => `${w.player}-Doubles`)).value.length,

            total_atp_singles_wins: atp_singles_wins.length,
            total_atp_doubles_wins: atp_doubles_wins.length,
            total_wta_singles_wins: wta_singles_wins.length,
            total_wta_doubles_wins: wta_doubles_wins.length,

            distinct_singles: distinctSingles,
            total_singles: atp_singles_wins.length + wta_singles_wins.length,
            distinct_doubles: distinctDoubles,
            total_doubles: atp_doubles_wins.length + wta_doubles_wins.length,
            distinct_atp: distinctAtp,
            total_atp: atp_singles_wins.length + atp_doubles_wins.length,
            distinct_wta: distinctWta,
            total_wta: wta_singles_wins.length + wta_doubles_wins.length,
            distinct: players.length,
            total: wins.length
          })
        }
      } else {
        const lastCountryEntry = useArrayFindLast(data, d => d.country === country).value
        if (lastCountryEntry) {
          data.push({ ...lastCountryEntry, year })
        } else {
          data.push({
            country,
            year,
            players: [],
            atp_singles_wins: 0,
            atp_doubles_wins: 0,
            wta_singles_wins: 0,
            wta_doubles_wins: 0,
            total_atp_singles_wins: 0,
            total_atp_doubles_wins: 0,
            total_wta_singles_wins: 0,
            total_wta_doubles_wins: 0,
            distinct_singles: 0,
            total_singles: 0,
            distinct_doubles: 0,
            total_doubles: 0,
            distinct_atp: 0,
            total_atp: 0,
            distinct_wta: 0,
            total_wta: 0,
            distinct: 0,
            total: 0
          })
        }
      }
    })
  })

  return data
})

const selectedTour = ref<TourType | null>(null)
const selectedType = ref<MatchType | null>(null)
const uniqueDimension = ref<keyof CountryAgg>("distinct")
const totalDimension = ref<keyof CountryAgg>("total")

watch([selectedTour, selectedType], () => {
  if (selectedTour.value && selectedType.value) {
    set(uniqueDimension, `${selectedTour.value.toLowerCase()}_${selectedType.value.toLowerCase()}_wins`)
    set(totalDimension, `total_${selectedTour.value.toLowerCase()}_${selectedType.value.toLowerCase()}_wins`)
  } else if (selectedTour.value) {
    set(uniqueDimension, `distinct_${selectedTour.value.toLowerCase()}`)
    set(totalDimension, `total_${selectedTour.value.toLowerCase()}`)
  } else if (selectedType.value) {
    set(uniqueDimension, `distinct_${selectedType.value.toLowerCase()}`)
    set(totalDimension, `total_${selectedType.value.toLowerCase()}`)
  } else {
    set(uniqueDimension, "distinct")
    set(totalDimension, "total")
  }
})

const option = computed(() => ({
  animationDuration: 10000,
  backgroundColor: "transparent",
  textStyle: { color: colorMode.value === "dark" ? colours.darkText : colours.lightText },
  grid: { containLabel: true },
  dataset: [
    {
      source: formattedCountry.value,
      dimensions: [
        "country",
        "year",
        "atp_singles_wins",
        "atp_doubles_wins",
        "wta_singles_wins",
        "wta_doubles_wins",
        "total_atp_singles_wins",
        "total_wta_singles_wins",
        "total_wta_singles_wins",
        "total_wta_doubles_wins",
        "distinct_singles",
        "total_singles",
        "distinct_doubles",
        "total_doubles",
        "distinct_atp",
        "total_atp",
        "distinct_wta",
        "total_wta",
        "distinct",
        "total"
      ]
    },
    ...uniqueCountries.map(country => ({
      transform: {
        type: "filter",
        config: { dimension: "country", value: country }
      }
    }))
  ],
  legend: {
    type: "scroll",
    textStyle: { color: colorMode.value === "dark" ? colours.darkText : colours.lightText },
    top: "middle",
    right: "right",
    orient: "vertical",
    height: "50%"
  },
  tooltip: {
    trigger: "item",
    axisPointer: {
      type: "cross",
      label: {
        backgroundColor: colorMode.value === "dark" ? colours.lightText : colours.darkText
      }
    },
    textStyle: {
      fontWeight: "bold"
    }
  },
  xAxis: { type: "category", axisLine: { show: true } },
  yAxis: { type: "value", name: "Wins", splitLine: { show: false }, axisLine: { show: true } },
  series: [
    ...uniqueCountries.map((country, i) => ({
      type: "line",
      name: `${country} Unique Wins`,
      smooth: true,
      datasetIndex: i + 1,
      encode: { x: "year", y: uniqueDimension.value }
    })),
    ...uniqueCountries.map((country, i) => ({
      type: "line",
      name: `${country} Total Wins`,
      smooth: true,
      datasetIndex: i + 1,
      encode: { x: "year", y: totalDimension.value }
    }))
  ]
}))
</script>

<template>
  <u-modal
    :title="tournamentName"
    description="Countries by Number of Winners"
    fullscreen
  >
    <u-button
      label="Chart"
      :icon="icons.lineChart"
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

      <v-chart
        class="min-h-200 w-full"
        :option
        :autoresize="true"
      />
    </template>
  </u-modal>
</template>
