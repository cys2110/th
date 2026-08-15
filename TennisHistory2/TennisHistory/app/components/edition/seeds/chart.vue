<script setup lang="ts">
const props = defineProps<{
  seeds: SeedInterface[]
  pending: boolean
}>()

const {
  params: { year }
} = useRoute("edition")

const tournamentStore = useTournamentStore()

// Chart configuration
const themeKey = inject(THEME_KEY)

const theme = COLOURS.light

const option = computed(() => ({
  backgroundColor: "transparent",
  grid: { containLabel: true, right: "20%" },
  textStyle: { color: theme.slate },
  color: [theme.indigo, theme.fuchsia, theme.emerald, theme.violet, theme.orange, theme.teal, theme.cyan, theme.rose],
  dataset: [
    {
      source: props.seeds,
      dimensions: ["draw", "seed", "rank", "team", "match_type", "tour"]
    },
    ...tournamentStore.tours
      .map(tour => [
        {
          transform: {
            type: "filter",
            config: {
              and: [
                { dimension: "match_type", value: "Singles" },
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
                { dimension: "match_type", value: "Doubles" },
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
                { dimension: "match_type", value: "Singles" },
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
                { dimension: "match_type", value: "Doubles" },
                { dimension: "draw", value: "Qualifying" },
                { dimension: "tour", value: tour }
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
    top: "middle",
    right: "right"
  },
  xAxis: {
    type: "category"
  },
  yAxis: {
    type: "value",
    name: "Rank at draw",
    splitLine: { show: false }
  },
  series: tournamentStore.tours
    .map((tour, index) => [
      {
        name: `Singles Main (${tour})`,
        type: "bar",
        stack: `${tour}-singles`,
        encode: { x: "seed", y: "rank" },
        datasetIndex: index * 4 + 1
      },
      {
        name: `Doubles Main (${tour})`,
        type: "bar",
        stack: `${tour}-doubles`,
        encode: { x: "seed", y: "rank" },
        datasetIndex: index * 4 + 2
      },
      {
        name: `Singles Qualifying (${tour})`,
        type: "bar",
        stack: `${tour}-singles`,
        encode: { x: "seed", y: "rank" },
        datasetIndex: index * 4 + 3
      },
      {
        name: `Doubles Qualifying (${tour})`,
        type: "bar",
        stack: `${tour}-doubles`,
        encode: { x: "seed", y: "rank" },
        datasetIndex: index * 4 + 4
      }
    ])
    .flat()
}))

const disabled = computed(() => !props.pending && (!props.seeds.length || props.seeds.every(s => !s.rank)))
</script>

<template>
  <u-modal
    :title="`${tournamentStore.name} ${year}`"
    description="Seeds"
    fullscreen
  >
    <u-button
      :icon="ICONS.stackedBarChart"
      :disabled
    />

    <template #body>
      <v-chart
        class="min-h-100 w-full"
        :theme="themeKey || 'dark'"
        :option="option"
        autoresize
        :loading="pending"
      >
        <template #tooltip="params">
          <u-badge
            :label="(params as any)[0].name"
            color="success"
            class="w-full mb-2"
            size="lg"
          />
          <u-page-columns class="lg:columns-2">
            <div
              v-for="param in params"
              :key="(param as any).componentIndex"
              class="my-1"
            >
              <div class="flex items-center">
                <span v-html="(param as any).marker" />
                <u-badge
                  :label="(param as any).data.draw"
                  :color="(param as any).data.draw"
                  class="w-full"
                />
              </div>
              <div class="flex justify-between gap-5">
                <span>{{ (param as any).data.team.map((player: BasePlayerType) => player.full_name).join(" | ") }}</span>
                <span>{{ (param as any).data.rank }}</span>
              </div>
            </div>
          </u-page-columns>
        </template>
      </v-chart>
    </template>
  </u-modal>
</template>
