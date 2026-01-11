<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"

const props = defineProps<{
  seeds: SeedType[]
  status: AsyncDataRequestStatus
}>()

const {
  params: { year }
} = useRoute("edition")
const toast = useToast()

const tournamentStore = useTournamentStore()
const open = ref(false)

// Chart configuration
const themeKey = inject(THEME_KEY)

const theme = computed(() => {
  const key = themeKey as keyof typeof COLOURS
  return COLOURS[key] ?? COLOURS.dark
})

const option = computed(() => ({
  backgroundColor: "transparent",
  grid: { containLabel: true, right: "20%" },
  textStyle: { color: theme.value.slate },
  color: [
    theme.value.indigo,
    theme.value.fuchsia,
    theme.value.emerald,
    theme.value.violet,
    theme.value.orange,
    theme.value.teal,
    theme.value.cyan,
    theme.value.rose
  ],
  dataset: [
    {
      source: props.seeds,
      dimensions: ["draw", "seed", "rank", "team", "type", "tour", "q_seed"]
    },
    ...tournamentStore.tours
      .map(tour => [
        {
          transform: {
            type: "filter",
            config: {
              and: [
                { dimension: "type", value: "Singles" },
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
                { dimension: "type", value: "Doubles" },
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
                { dimension: "type", value: "Singles" },
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
                { dimension: "type", value: "Doubles" },
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
    // formatter: (params: any) => {
    //   console.log(params)
    // }
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
        encode: { x: "q_seed", y: "rank" },
        datasetIndex: index * 4 + 3
      },
      {
        name: `Doubles Qualifying (${tour})`,
        type: "bar",
        stack: `${tour}-doubles`,
        encode: { x: "q_seed", y: "rank" },
        datasetIndex: index * 4 + 4
      }
    ])
    .flat()
}))

const handleClick = (params: any) => {
  toast.clear()

  toast.add({
    title: "Go to...",
    duration: Infinity,
    progress: false,
    actions: params.data.team.map((player: PersonType) => ({
      label: `${player.first_name} ${player.last_name}`,
      icon: ICONS.person,
      to: {
        name: "player",
        params: { id: player.id, name: kebabCase(`${player.first_name} ${player.last_name}`) }
      }
    }))
  })
}

watch(open, () => {
  if (!open.value) toast.clear()
})
onBeforeRouteLeave(() => {
  toast.clear()
})
onUnmounted(() => {
  toast.clear()
})
</script>

<template>
  <u-modal
    :title="`${tournamentStore.name} ${year}`"
    description="Seeds"
    fullscreen
    v-model:open="open"
  >
    <u-button :icon="ICONS.barChart" />

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
                <span>{{ (param as any).data.team.map((player: PersonType) => `${player.first_name} ${player.last_name}`).join(" | ") }}</span>
                <span>{{ (param as any).data.rank }}</span>
              </div>
            </div>
          </u-page-columns>
        </template>
      </v-chart>
    </template>
  </u-modal>
</template>
