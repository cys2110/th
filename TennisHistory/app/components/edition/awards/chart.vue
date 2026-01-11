<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"

const props = defineProps<{
  awards: AwardType[]
  status: AsyncDataRequestStatus
}>()

const {
  params: { year }
} = useRoute("edition")

const tournamentStore = useTournamentStore()

// Chart configuration
const themeKey = inject(THEME_KEY)

const theme = computed(() => {
  const key = themeKey as keyof typeof COLOURS
  return COLOURS[key] ?? COLOURS.dark
})

const oppositeTheme = computed(() => {
  const key = (themeKey as keyof typeof COLOURS) === "light" ? "dark" : "light"
  return COLOURS[key] ?? COLOURS.light
})

const option = computed(() => ({
  backgroundColor: "transparent",
  grid: { containLabel: true, right: "15%" },
  textStyle: { color: theme.value.slate },
  color: [
    theme.value.orange,
    oppositeTheme.value.orange,
    theme.value.indigo,
    oppositeTheme.value.indigo,
    theme.value.emerald,
    oppositeTheme.value.emerald,
    theme.value.yellow,
    oppositeTheme.value.yellow,
    theme.value.violet,
    oppositeTheme.value.violet,
    theme.value.fuchsia,
    oppositeTheme.value.fuchsia
  ],
  dataset: [
    {
      source: props.awards,
      dimensions: ["round", "points", "pm", "currency", "type", "tour"]
    },
    ...tournamentStore.tours
      .map(tour => [
        {
          transform: {
            type: "filter",
            config: {
              and: [
                { dimension: "tour", value: tour },
                { dimension: "type", value: "Singles" }
              ]
            }
          }
        },
        {
          transform: {
            type: "filter",
            config: {
              and: [
                { dimension: "tour", value: tour },
                { dimension: "type", value: "Doubles" }
              ]
            }
          }
        }
      ])
      .flat()
  ],
  tooltip: {
    trigger: "axis"
  },
  legend: {
    right: "right",
    top: "middle"
  },
  xAxis: {
    type: "category",
    inverse: true,
    axisLabel: { color: theme.value.slate }
  },
  yAxis: [
    {
      type: "value",
      name: `Prize Money (${props.awards[0]?.currency || "$"})`,
      axisLabel: {
        formatter: (value: number) => value.toLocaleString("en-GB", { style: "currency", currency: props.awards[0]?.currency || "USD" })
      }
    },
    {
      type: "value",
      name: "Points",
      splitLine: { show: false },
      axisLabel: {
        formatter: (value: number) => value.toLocaleString("en-GB")
      }
    }
  ],
  series: tournamentStore.tours
    .map((tour, index) => [
      {
        name: `Singles Prize Money (${tour})`,
        type: "line",
        encode: { x: "round", y: "pm" },
        yAxisIndex: 0,
        datasetIndex: index * 2 + 1,
        tooltip: {
          valueFormatter: (value: number) => value.toLocaleString("en-GB", { style: "currency", currency: props.awards[0]?.currency || "USD" })
        }
      },
      {
        name: `Singles Points (${tour})`,
        type: "scatter",
        encode: { x: "round", y: "points" },
        yAxisIndex: 1,
        datasetIndex: index * 2 + 1,
        symbol: "diamond"
      },
      {
        name: `Doubles Prize Money (${tour})`,
        type: "line",
        encode: { x: "round", y: "pm" },
        yAxisIndex: 0,
        datasetIndex: index * 2 + 2,
        tooltip: {
          valueFormatter: (value: number) => value.toLocaleString("en-GB", { style: "currency", currency: props.awards[0]?.currency || "USD" })
        }
      },
      {
        name: `Doubles Points (${tour})`,
        type: "scatter",
        encode: { x: "round", y: "points" },
        yAxisIndex: 1,
        datasetIndex: index * 2 + 2,
        symbol: "diamond"
      }
    ])
    .flat()
}))
</script>

<template>
  <u-modal
    :title="`${tournamentStore.name} ${year}`"
    description="Awards"
    fullscreen
  >
    <u-button :icon="ICONS.scatterChart" />

    <template #body>
      <v-chart
        class="min-h-100 w-full"
        :theme="themeKey || 'dark'"
        :option="option"
        autoresize
        :loading="status === 'pending'"
      />
    </template>
  </u-modal>
</template>
