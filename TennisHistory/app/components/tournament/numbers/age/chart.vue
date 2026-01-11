<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"
import type { CallbackDataParams } from "echarts/types/dist/shared"

const props = defineProps<{
  winners: TournamentAgeType[]
  status: AsyncDataRequestStatus
}>()

const tournamentStore = useTournamentStore()
const toast = useToast()
const open = ref(false)

// Chart configuration
const themeKey = inject(THEME_KEY)

const theme = computed(() => {
  const key = themeKey as keyof typeof COLOURS
  return COLOURS[key] ?? COLOURS.dark
})

const colours = computed(() => Object.keys(theme.value))

const playerColourMap = computed(() => {
  const uniquePlayers = [...new Set(props.winners.map(winner => `${winner.first_name} ${winner.last_name}`))]

  return Object.fromEntries(
    uniquePlayers.map((player, index) => [player, theme.value[colours.value[index % colours.value.length] as keyof typeof theme.value]])
  )
})

const formattedWinners = computed(() =>
  props.winners.map(winner => {
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
  grid: { containLabel: true },
  textStyle: { color: theme.value.slate },
  dataset: [
    {
      source: formattedWinners.value,
      dimensions: ["age", "player", "tour", "type", "year", "colour", "stringAge", "id", "edId"]
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
  series: [
    {
      type: "bar",
      encode: { radius: "player", angle: "age" },
      coordinateSystem: "polar",
      itemStyle: { color: ({ data }: any) => data.colour },
      roundCap: true,
      animationDuration: 2000,
      barMaxWidth: 30
    }
  ]
}))

const handleClick = (params: any) => {
  toast.clear()

  toast.add({
    title: "Go to...",
    duration: Infinity,
    progress: false,
    actions: [
      {
        label: `${(params.data as any).player}`,
        icon: ICONS.player,
        to: {
          name: "player",
          params: {
            id: (params.data as any).id,
            name: kebabCase(`${(params.data as any).first_name} ${(params.data as any).last_name}`)
          }
        }
      },
      {
        label: (params.data as any).year.toString(),
        icon: ICONS.calendar,
        to: {
          name: "edition",
          params: {
            id: tournamentStore.id,
            name: kebabCase(tournamentStore.name),
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
    description="Winners by Age"
    fullscreen
  >
    <u-button
      label="Chart"
      :icon="ICONS.polarChart"
    />

    <template #body>
      <div class="h-full flex gap-10">
        <v-chart
          class="min-h-100 w-full flex-1"
          :theme="themeKey || 'dark'"
          :option="option"
          autoresize
          :loading="status === 'pending'"
          @click="handleClick"
        >
          <template #tooltip="params">
            <div class="flex items-center justify-between gap-5">
              <div>
                <span v-html="(params as CallbackDataParams)?.marker" />
                <span class="font-semibold">{{ ((params as CallbackDataParams).data as any).player }}</span>
              </div>
              <u-badge
                :label="((params as CallbackDataParams).data as any).tour"
                :color="((params as CallbackDataParams).data as any).tour"
              />
            </div>
            <div class="flex justify-between gap-5 mt-3">
              <div>{{ ((params as CallbackDataParams).data as any).year }}</div>
              <div>{{ ((params as CallbackDataParams).data as any).stringAge }}</div>
            </div>
          </template>
        </v-chart>

        <u-page-list class="my-auto mr-5">
          <div
            v-for="[player, colour] in Object.entries(playerColourMap)"
            :key="player"
            class="flex items-center gap-2"
          >
            <u-icon
              :name="ICONS.colour"
              class="text-xl"
              :style="{ color: colour }"
            />
            <span class="text-sm">{{ player }}</span>
          </div>
        </u-page-list>
      </div>
    </template>
  </u-modal>
</template>
