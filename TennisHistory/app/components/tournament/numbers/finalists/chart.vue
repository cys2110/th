<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"
import type { CallbackDataParams } from "echarts/types/src/util/types.js"

const props = defineProps<{
  finalists: TournamentFinalistType[]
  status: AsyncDataRequestStatus
}>()

const tournamentStore = useTournamentStore()
const router = useRouter()

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

const colours = computed(() => {
  const colourKeys = Object.keys(theme.value)
  return colourKeys.map(key => theme.value[key as keyof typeof theme.value])
})

const option = computed(() => ({
  backgroundColor: "transparent",
  grid: { containLabel: true, right: "20%" },
  color: colours.value,
  tooltip: {
    trigger: "axis",
    axisPointer: { type: "shadow" }
  },
  legend: {
    right: "right",
    top: "middle"
  },
  dataset: [
    {
      source: props.finalists,
      dimensions: ["first_name", "last_name", "id", "country", "singles_wins", "singles_losses", "doubles_wins", "doubles_losses", "tour"]
    }
  ],
  xAxis: {
    type: "value",
    axisLabel: { color: theme.value.slate }
  },
  yAxis: {
    type: "category",
    inverse: true,
    axisLabel: {
      color: theme.value.slate,
      formatter: (value: string) => {
        const player = props.finalists.find(p => p.id === value)!
        return `${player.first_name} ${player.last_name}`
      }
    },
    nameTextStyle: { color: oppositeTheme.value.slate }
  },
  series: [
    {
      name: "Singles Wins",
      type: "bar",
      encode: { x: "singles_wins", y: "id" },
      stack: "singles",
      itemStyle: { color: theme.value.orange },
      animationDuration: 2000
    },
    {
      name: "Singles Losses",
      type: "bar",
      encode: { x: "singles_losses", y: "id" },
      stack: "singles",
      itemStyle: { color: oppositeTheme.value.orange },
      animationDuration: 2000
    },
    {
      name: "Doubles Wins",
      type: "bar",
      encode: { x: "doubles_wins", y: "id" },
      stack: "doubles",
      itemStyle: { color: theme.value.fuchsia },
      animationDuration: 2000
    },
    {
      name: "Doubles Losses",
      type: "bar",
      encode: { x: "doubles_losses", y: "id" },
      stack: "doubles",
      itemStyle: { color: oppositeTheme.value.fuchsia },
      animationDuration: 2000
    }
  ]
}))

const handleClick = (params: CallbackDataParams) => {
  router.push({
    name: "player",
    params: {
      id: (params.data as TournamentFinalistType).id,
      name: kebabCase(`${(params.data as TournamentFinalistType).first_name} ${(params.data as TournamentFinalistType).last_name}`)
    }
  })
}
</script>

<template>
  <u-modal
    :title="tournamentStore.name"
    description="Players by Number of Finals"
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
          <div class="font-semibold mb-2">
            {{ ((params as CallbackDataParams[])[0]!.data as TournamentFinalistType).first_name }}
            {{ ((params as CallbackDataParams[])[0]!.data as TournamentFinalistType).last_name }}
          </div>

          <div class="flex justify-between gap-5">
            <div class="flex items-center gap-1">
              <u-icon :name="ICONS.person" />
              <span>Singles</span>
            </div>
            <div>
              {{
                percentage(
                  ((params as CallbackDataParams[])[0]!.data as TournamentFinalistType).singles_wins,
                  ((params as CallbackDataParams[])[0]!.data as TournamentFinalistType).singles_wins +
                    ((params as CallbackDataParams[])[0]!.data as TournamentFinalistType).singles_losses
                )
              }}%
            </div>
          </div>

          <div class="flex justify-between gap-5">
            <div class="flex items-center gap-1">
              <u-icon :name="ICONS.people" />
              <span>Doubles</span>
            </div>
            <div>
              {{
                percentage(
                  ((params as CallbackDataParams[])[0]!.data as TournamentFinalistType).doubles_wins,
                  ((params as CallbackDataParams[])[0]!.data as TournamentFinalistType).doubles_wins +
                    ((params as CallbackDataParams[])[0]!.data as TournamentFinalistType).doubles_losses
                )
              }}%
            </div>
          </div>
        </template>
      </v-chart>
    </template>
  </u-modal>
</template>
