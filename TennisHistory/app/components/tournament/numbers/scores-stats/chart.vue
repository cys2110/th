<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"
import type { CallbackDataParams } from "echarts/types/dist/shared"

const props = defineProps<{
  winners: TournamentScoresStatsType[]
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
const oppositeTheme = computed(() => {
  const key = themeKey === "light" ? "dark" : "light"
  return COLOURS[key as keyof typeof COLOURS]
})

const colours = computed(() => Object.keys(theme.value))

const teams = computed(
  () => useArrayUnique(props.winners.map(winner => winner.team.map(player => `${player.first_name} ${player.last_name}`).join(" / "))).value
)

const formattedWinners = computed(() =>
  props.winners.map(winner => ({
    ...winner,
    team: `${winner.team.map(player => `${player.first_name} ${player.last_name}`).join(" / ")}`,
    players: winner.team,
    sets_pc: percentage(winner.sets_won, winner.sets_won + winner.sets_lost),
    games_pc: percentage(winner.games_won, winner.games_won + winner.games_lost)
  }))
)

const option = computed(() => ({
  backgroundColor: "transparent",
  grid: { containLabel: true, right: "30%" },
  textStyle: { color: theme.value.slate },
  color: [theme.value.violet, theme.value.lime, theme.value.blue, theme.value.rose],
  tooltip: {
    trigger: "axis",
    axisPointer: { type: "shadow" }
  },
  legend: {
    right: "right",
    top: "middle",
    data: teams.value,
    icon: "pin",
    orient: "vertical",
    type: "scroll"
  },
  dataset: [
    {
      source: formattedWinners.value,
      dimensions: ["sets_won", "team", "tour", "type", "year", "sets_lost", "games_won", "games_lost", "players", "sets_pc", "games_pc"]
    },
    ...teams.value.map(team => ({
      transform: {
        type: "filter",
        config: {
          dimension: "team",
          value: team
        }
      }
    }))
  ],
  xAxis: {
    type: "category",
    name: "Year",
    // inverse: true,
    nameTextStyle: { color: oppositeTheme.value.slate },
    axisLabel: { color: oppositeTheme.value.slate }
  },
  yAxis: {
    type: "value",
    name: "%",
    splitLine: { show: false },
    nameTextStyle: { color: oppositeTheme.value.slate },
    axisLabel: { color: oppositeTheme.value.slate }
  },
  series: teams.value.flatMap((team, index) => [
    {
      name: team,
      type: "scatter",
      encode: { x: "year", y: "sets_pc" },
      datasetIndex: index + 1,
      symbol: "diamond",
      symbolSize: 15,
      itemStyle: { color: theme.value[colours.value[index] as keyof typeof theme.value] }
    },
    {
      name: team,
      type: "line",
      encode: { x: "year", y: "games_pc" },
      datasetIndex: index + 1,
      itemStyle: { color: theme.value[colours.value[index] as keyof typeof theme.value] },
      animationDuration: 2000
    }
  ])
}))

const handleClick = (params: any) => {
  toast.clear()

  toast.add({
    title: "Go to...",
    duration: Infinity,
    progress: false,
    actions: [
      ...(params.data as any).players.map((player: PersonType) => ({
        label: `${player.first_name} ${player.last_name}`,
        icon: ICONS.player,
        to: {
          name: "player",
          params: {
            id: player.id,
            name: kebabCase(`${player.first_name} ${player.last_name}`)
          }
        }
      })),
      {
        label: (params.data as TournamentScoresStatsType).year.toString(),
        icon: ICONS.calendar,
        to: {
          name: "edition",
          params: {
            id: tournamentStore.id,
            name: kebabCase(tournamentStore.name),
            year: (params.data as TournamentScoresStatsType).year.toString(),
            edId: (params.data as TournamentScoresStatsType).id.toString()
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
      :icon="ICONS.barChart"
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
          <template
            v-for="(param, index) in params"
            :key="index"
          >
            <div v-if="(index as number) % 2 === 0">
              <div class="font-semibold">
                <span v-html="(param as CallbackDataParams)?.marker" />
                <span>{{ (param as CallbackDataParams).seriesName }}</span>
              </div>
              <div class="*:flex *:justify-between *:gap-5">
                <div>
                  <div>Sets Won</div>
                  <div>{{ ((param as CallbackDataParams).data as any).sets_pc }}%</div>
                </div>
                <div>
                  <div>Games Won</div>
                  <div>{{ ((param as CallbackDataParams).data as any).games_pc }}%</div>
                </div>
              </div>
            </div>
          </template>
        </template>
      </v-chart>
    </template>
  </u-modal>
</template>
