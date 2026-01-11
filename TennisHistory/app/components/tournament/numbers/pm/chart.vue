<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"

const props = defineProps<{
  rounds: TournamentPmType[]
  status: AsyncDataRequestStatus
}>()

const tournamentStore = useTournamentStore()
const router = useRouter()

const selectedTour = ref(tournamentStore.tours[0] ?? "ATP")
const selectedType = ref<MatchTypeEnumType>("Singles")

const roundNames = useArrayUnique(props.rounds.sort((a, b) => b.number - a.number).map(round => round.round))

// Chart configuration
const themeKey = inject(THEME_KEY)

const theme = computed(() => {
  const key = themeKey as keyof typeof COLOURS
  return COLOURS[key] ?? COLOURS.dark
})

const themeColours = computed(() => {
  const colourKeys = Object.keys(theme.value)
  return colourKeys.map(key => theme.value[key as keyof typeof theme.value])
})

const option = computed(() => ({
  backgroundColor: "transparent",
  grid: { containLabel: true, right: "15%" },
  dataset: [
    {
      source: props.rounds,
      dimensions: ["id", "pm", "number", "round", "year", "points", "type", "tour", "currency"]
    },
    ...roundNames.value.map(round => ({
      transform: {
        type: "filter",
        config: {
          and: [
            { dimension: "round", value: round },
            { dimension: "tour", value: selectedTour.value },
            { dimension: "type", value: selectedType.value }
          ]
        }
      }
    }))
  ],
  legend: {
    right: "right",
    top: "middle"
  },
  tooltip: {
    trigger: "item",
    axisPointer: {
      type: "cross"
    },
    textStyle: {
      fontWeight: "bold"
    }
  },
  xAxis: {
    type: "category",
    name: "Year",
    boundaryGap: false,
    nameLocation: "center",
    nameGap: 30,
    inverse: true
  },
  yAxis: [
    {
      type: "value",
      name: "Prize Money",
      axisLabel: {
        formatter: (value: number) => {
          const currency = props.rounds.find(round => round.tour === selectedTour.value)?.currency
          return currency ? value.toLocaleString("en-GB", { style: "currency", currency }) : value
        }
      }
    },
    {
      type: "value",
      name: "Points",
      splitLine: { show: false }
    }
  ],
  series: roundNames.value.map((round, index) => ({
    name: round,
    type: "line",
    smooth: true,
    stack: "Pm",
    itemStyle: {
      color: themeColours.value[index % themeColours.value.length]
    },
    areaStyle: {
      color: themeColours.value[index % themeColours.value.length],
      opacity: 0.25
    },
    emphasis: { focus: "series" },
    encode: { x: "year", y: "pm" },
    yAxisIndex: 0,
    datasetIndex: index + 1,
    tooltip: {
      valueFormatter: (value: number) => {
        const currency = props.rounds.find(round => round.tour === selectedTour.value)?.currency
        return currency ? value.toLocaleString("en-GB", { style: "currency", currency }) : value
      }
    }
  }))
}))
</script>

<template>
  <u-modal
    :title="tournamentStore.name"
    description="Historical Prize Money"
    fullscreen
    :ui="{ footer: 'flex justify-between' }"
  >
    <u-button
      label="Chart"
      :icon="ICONS.areaChart"
    />

    <template #body>
      <v-chart
        class="min-h-100 w-full"
        :theme="themeKey || 'dark'"
        :option="option"
        autoresize
        :loading="status === 'pending'"
      />
    </template>

    <template #footer>
      <filters-tours
        v-if="tournamentStore.tours.length > 1"
        v-model="selectedTour"
        :items="tournamentStore.tours"
        orientation="horizontal"
      />

      <filters-match-type
        v-model="selectedType"
        orientation="horizontal"
      />
    </template>
  </u-modal>
</template>
