<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"
import type { CallbackDataParams } from "echarts/types/src/util/types.js"

const props = defineProps<{
  winners: TournamentFinalistsType[]
  status: AsyncDataRequestStatus
}>()
const {
  params: { id }
} = useRoute("tournament")

const tournamentStore = useTournamentStore()
const router = useRouter()
const toast = useToast()
const open = ref(false)

// Chart configuration
const themeKey = inject(THEME_KEY)

const theme = computed(() => {
  const key = themeKey as keyof typeof COLOURS
  return COLOURS[key] ?? COLOURS.dark
})
const oppositeTheme = computed(() => {
  const key = themeKey === "light" ? "dark" : "light"
  return COLOURS[key as keyof typeof COLOURS]
})
const colours = computed(() => Object.keys(theme.value))

const selectedType = ref<"Singles" | "Doubles" | "Total">("Total")
const selectedTour = ref<(keyof typeof tourEnum)[]>(tournamentStore.tours)

const uniqueCountries = computed(() => useArrayUnique(props.winners.map(w => w.country!.name)).value)
const uniqueYears = computed(() => useArrayUnique(props.winners.map(w => w.year)).value.sort())

const aggregatedData = computed(() => {
  const seriesList: any[] = []

  uniqueCountries.value.forEach((country, index) => {
    const distinctWinners = new Set<string>()
    const distinctWins: number[] = []
    const totalWins: number[] = []
    let runningTotal = 0

    uniqueYears.value.forEach(year => {
      const wins = props.winners.filter(w => {
        const isCountryMatch = w.country!.name === country
        const isYearMatch = w.year === year
        const isTourMatch = selectedTour.value.includes(w.tour as keyof typeof tourEnum)
        const isTypeMatch = selectedType.value === "Singles" ? w.type === "Singles" : selectedType.value === "Doubles" ? w.type === "Doubles" : true

        return isCountryMatch && isYearMatch && isTypeMatch && isTourMatch
      })
      wins.forEach(w => distinctWinners.add(w.id.toString()))
      distinctWins.push(distinctWinners.size)

      runningTotal += wins.length
      totalWins.push(runningTotal)
    })

    seriesList.push(
      {
        id: `${country}-distinct`,
        name: country,
        type: "line",
        smooth: true,
        data: distinctWins,
        itemStyle: {
          color: theme.value[colours.value[index % colours.value.length] as keyof typeof theme.value]
        }
      },
      {
        id: `${country}-total`,
        name: country,
        type: "line",
        symbol: "diamond",
        symbolSize: 20,
        smooth: true,
        data: totalWins,
        itemStyle: {
          color: theme.value[colours.value[index % colours.value.length] as keyof typeof oppositeTheme.value]
        }
      }
    )
  })

  return seriesList
})

const option = computed(() => ({
  animationDuration: 5000,
  backgroundColor: "transparent",
  textStyle: { color: theme.value.slate },
  grid: { containLabel: true, right: "20%" },
  legend: {
    right: "right",
    top: "middle",
    icon: "pin",
    data: uniqueCountries.value,
    orient: "vertical",
    type: "scroll"
  },
  tooltip: {
    trigger: "item",
    axisPointer: {
      type: "cross"
    }
  },
  xAxis: {
    type: "category",
    axisLine: { show: true },
    data: uniqueYears.value
  },
  yAxis: { type: "value", name: "Wins", splitLine: { show: false }, axisLine: { show: true } },
  series: aggregatedData.value
}))

const getSelectedSeries = (params: any) => {
  const selectedDistinct = aggregatedData.value.find(series => series.id === params.seriesId.replace("-total", "-distinct"))
  const selectedTotal = aggregatedData.value.find(series => series.id === params.seriesId.replace("-distinct", "-total"))

  return [selectedDistinct.data[params.dataIndex], selectedTotal.data[params.dataIndex]]
}

const getSelectedItem = (params: any) => props.winners.find(w => w.country!.name === params.seriesName && w.year.toString() === params.name)

const handleClick = (params: any) => {
  toast.clear()

  const selectedItem = getSelectedItem(params)

  toast.add({
    title: "Go to...",
    duration: Infinity,
    progress: false,
    actions: [
      {
        label: params.seriesName,
        icon: getFlagCode(selectedItem!.country!),
        to: {
          name: "country",
          params: {
            id: selectedItem!.country!.id,
            name: kebabCase(params.seriesName)
          }
        }
      },
      {
        label: params.name.toString(),
        icon: ICONS.calendar,
        to: {
          name: "edition",
          params: {
            id: tournamentStore.id,
            name: kebabCase(tournamentStore.name),
            year: params.name.toString(),
            edId: selectedItem!.edId
          }
        }
      }
    ]
  })
}

watch(open, () => {
  if (!open.value) toast.clear()
})

// Clear toasts on unmount and route change
onUnmounted(() => {
  toast.clear()
})
onBeforeRouteLeave(() => {
  toast.clear()
})
</script>

<template>
  <u-modal
    :title="tournamentStore.name"
    description="Countries by Number of Winners"
    fullscreen
    :ui="{ footer: 'flex justify-between' }"
  >
    <u-button
      label="Chart"
      :icon="ICONS.lineChart"
    />

    <template #body>
      <v-chart
        class="min-h-100 w-full"
        :theme="themeKey || 'dark'"
        :option="option"
        autoresize
        :loading="status === 'pending'"
        @click="handleClick"
      >
        <template #tooltip="params">
          <div>
            <span v-html="(params as CallbackDataParams)?.marker" />
            <span class="font-semibold">{{ (params as CallbackDataParams).seriesName }} - {{ (params as CallbackDataParams).name }}</span>
          </div>
          <div class="*:flex *:justify-between *:gap-5">
            <div>
              <div>Distinct Wins</div>
              <div>{{ getSelectedSeries(params)[0] }}</div>
            </div>
            <div>
              <div>Total Wins</div>
              <div>{{ getSelectedSeries(params)[1] }}</div>
            </div>
          </div>
        </template>
      </v-chart>
    </template>

    <template #footer>
      <u-radio-group
        v-model="selectedType"
        :items="['Singles', 'Doubles', 'Total']"
        orientation="horizontal"
      />

      <filters-tours
        v-if="tournamentStore.tours.length > 1"
        v-model="selectedTour"
        :items="tournamentStore.tours"
        orientation="horizontal"
      />
    </template>
  </u-modal>
</template>
