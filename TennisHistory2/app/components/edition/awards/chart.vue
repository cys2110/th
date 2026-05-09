<script setup lang="ts">
const props = defineProps<{
  awards: Array<AwardInterface>
  pending: boolean
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
    theme.value.orange,
    theme.value.indigo,
    theme.value.indigo,
    theme.value.emerald,
    theme.value.emerald,
    theme.value.yellow,
    theme.value.yellow,
    theme.value.violet,
    theme.value.violet,
    theme.value.fuchsia,
    theme.value.fuchsia
  ],
  dataset: [
    {
      source: props.awards,
      dimensions: ["round", "points", "pm", "currency", "match_type", "tour"]
    },
    ...tournamentStore.tours
      .map(tour => [
        {
          transform: {
            type: "filter",
            config: {
              and: [
                { dimension: "tour", value: tour },
                { dimension: "match_type", value: "Singles" }
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
                { dimension: "match_type", value: "Doubles" }
              ]
            }
          }
        }
      ])
      .flat()
  ],
  tooltip: { trigger: "axis" },
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
      name: `Prize Money`,
      axisLabel: {
        formatter: (value: number) => value.toLocaleString()
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
        datasetIndex: index * 2 + 1
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
        datasetIndex: index * 2 + 2
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
        :loading="pending"
      >
        <template #tooltip="params">
          <div class="*:grid *:grid-cols-3 *:text-center *:gap-6 divide-y">
            <div class="font-semibold">
              <div>{{ (params as any)[0].data.round }}</div>
              <div>PM</div>
              <div>Points</div>
            </div>

            <template
              v-for="(param, index) in params"
              :key="index"
            >
              <div v-if="(index as number) % 2 === 0">
                <div class="flex items-center gap-2">
                  <span v-html="(param as any).marker" />
                  <div>{{ (param as any).data.tour }} - {{ (param as any).data.match_type }}</div>
                </div>

                <div>{{ (param as any).data.pm.toLocaleString("en-GB", { style: "currency", currency: (param as any).data.currency }) }}</div>

                <div>{{ (param as any).data.points.toLocaleString() }}</div>
              </div>
            </template>
          </div>
        </template>
      </v-chart>
    </template>
  </u-modal>
</template>
