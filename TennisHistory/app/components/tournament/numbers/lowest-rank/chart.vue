<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"
import type { CallbackDataParams } from "echarts/types/dist/shared"

const props = defineProps<{
  events: TournamentLowestRankedType[]
  status: AsyncDataRequestStatus
}>()

const {
  params: { id, name }
} = useRoute("tournament")
const tournamentStore = useTournamentStore()
const toast = useToast()
const open = ref(false)

const tours = computed(() => useArrayUnique(props.events.map(event => event.tour)).value)

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

const option = computed(() => ({
  backgroundColor: "transparent",
  grid: { containLabel: true, right: "20%" },
  textStyle: { color: theme.value.slate },
  color: [theme.value.violet, theme.value.lime, theme.value.blue, theme.value.rose],
  tooltip: {
    trigger: "axis",
    axisPointer: { type: "shadow" }
  },
  ...(tours.value.length > 1
    ? [
        {
          legend: {
            right: "right",
            top: "middle",
            orientation: "vertical"
          }
        }
      ]
    : []),
  dataset: [
    {
      source: props.events,
      dimensions: ["id", "first_name", "last_name", "tour", "year", "rank", "round"]
    },
    ...tours.value.map(tour => ({
      transform: {
        type: "filter",
        config: {
          dimension: "tour",
          value: tour
        }
      }
    }))
  ],
  xAxis: {
    type: "category",
    name: "Round",
    nameTextStyle: { color: oppositeTheme.value.slate },
    axisLabel: { color: oppositeTheme.value.slate }
  },
  yAxis: {
    type: "value",
    name: "Rank",
    nameTextStyle: { color: oppositeTheme.value.slate },
    axisLabel: { color: oppositeTheme.value.slate }
  },
  series: tours.value.map((tour, index) => ({
    name: tour,
    type: "bar",
    encode: { x: "round", y: "rank" },
    itemStyle: {
      borderRadius: [25, 25, 0, 0]
    },
    datasetIndex: index + 1,
    label: {
      show: true,
      formatter: "{@first_name} {@last_name} - {@year}",
      rotate: 90
    },
    animationDuration: 2000,
    barMaxWidth: 30
  }))
}))

const handleClick = (params: any) => {
  toast.clear()

  toast.add({
    title: "Go to...",
    duration: Infinity,
    progress: false,
    actions: [
      {
        label: `${(params.data as TournamentLowestRankedType).first_name} ${(params.data as TournamentLowestRankedType).last_name}`,
        icon: ICONS.player,
        to: {
          name: "player",
          params: {
            id: (params.data as TournamentLowestRankedType).id,
            name: kebabCase(`${(params.data as TournamentLowestRankedType).first_name} ${(params.data as TournamentLowestRankedType).last_name}`)
          }
        }
      },
      {
        label: (params.data as TournamentLowestRankedType).year.toString(),
        icon: ICONS.calendar,
        to: {
          name: "edition",
          params: {
            id,
            name,
            year: (params.data as TournamentLowestRankedType).year.toString(),
            edId: (params.data as TournamentLowestRankedType).edId.toString()
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
    v-model:open="open"
    :title="tournamentStore.name"
    description="Lowest Ranked Singles Player to Reach Later Rounds"
    fullscreen
  >
    <u-button
      :icon="ICONS.barChart"
      label="Chart"
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
          <div
            v-for="(param, index) in params"
            :key="index"
          >
            <div v-if="tours.length > 1">
              <span v-html="(param as CallbackDataParams)?.marker" />
              <span class="font-semibold">{{ (param as CallbackDataParams)?.seriesName }}</span>
            </div>

            <div
              class="flex items-center justify-between gap-5"
              :class="{ 'font-semibold': tours.length < 2 }"
            >
              <div>
                <span
                  v-if="tours.length < 2"
                  v-html="(param as CallbackDataParams)?.marker"
                />
                {{ ((param as CallbackDataParams).data as TournamentLowestRankedType).year }} —
                {{ ((param as CallbackDataParams).data as TournamentLowestRankedType).first_name }}
                {{ ((param as CallbackDataParams).data as TournamentLowestRankedType).last_name }}
              </div>
              <div>{{ ((param as CallbackDataParams).data as TournamentLowestRankedType).rank }}</div>
            </div>
          </div>
        </template>
      </v-chart>
    </template>
  </u-modal>
</template>
