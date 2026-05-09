<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"
import type { CallbackDataParams } from "echarts/types/dist/shared"

const props = defineProps<{
  index: WLIndexType[]
  status: AsyncDataRequestStatus
}>()

const playerStore = usePlayerStore()

const levels = defineModel<string[] | null>("levels")
const drawType = defineModel<DrawEnumType>("drawType")
const years = defineModel<number[] | undefined>("years")

// Chart configuration
const themeKey = inject(THEME_KEY)

const theme = computed(() => {
  const key = themeKey as keyof typeof COLOURS
  return COLOURS[key] ?? COLOURS.dark
})
const titleTheme = computed(() => {
  const key = themeKey === "light" ? "dark" : "light"
  return COLOURS[key as keyof typeof COLOURS]
})

const option = computed(() => ({
  backgroundColor: "transparent",
  grid: { containLabel: true },
  tooltip: {
    trigger: "axis",
    backgroundColor: theme.value.slate,
    textStyle: { color: titleTheme.value.slate }
  },
  textStyle: { color: theme.value.slate },
  dataset: { source: props.index, dimensions: ["category", "stat", "titles", "value", "wins", "losses"] },
  xAxis: [
    {
      type: "value",
      name: "Index",
      max: 1,
      splitLine: {
        lineStyle: { color: titleTheme.value.slate }
      }
    },
    { type: "value", name: "Titles", splitLine: { show: false } }
  ],
  yAxis: { type: "category", inverse: true },
  series: [
    {
      name: "Index",
      type: "bar",
      encode: { x: "value", y: "stat" },
      xAxisIndex: 0,
      tooltip: { valueFormatter: (value: number) => value.toFixed(3) },
      itemStyle: {
        borderRadius: [0, 25, 25, 0],
        color: (params: { value: WLIndexType }) => {
          switch (params.value.category) {
            case "Match record":
              return theme.value.violet
            case "Pressure points":
              return theme.value.sky
            case "Environment":
              return theme.value.fuchsia
            default:
              return theme.value.emerald
          }
        }
      },
      animationDuration: 2000
    },
    {
      name: "Titles",
      type: "scatter",
      encode: { x: "titles", y: "stat" },
      xAxisIndex: 1,
      symbol: "diamond",
      symbolSize: 15,
      itemStyle: {
        color: (params: { value: WLIndexType }) => {
          switch (params.value.category) {
            case "Match record":
              return titleTheme.value.violet
            case "Pressure points":
              return titleTheme.value.sky
            case "Environment":
              return titleTheme.value.fuchsia
            default:
              return titleTheme.value.emerald
          }
        }
      }
    }
  ]
}))
</script>

<template>
  <u-modal
    :title="playerStore.fullName"
    description="Win-Loss Index"
    fullscreen
    :ui="{ footer: 'grid grid-cols-3' }"
  >
    <u-button
      label="Chart"
      :icon="ICONS.barChart"
      block
    />

    <template #body>
      <v-chart
        class="min-h-150 w-full"
        :theme="themeKey || 'dark'"
        :option="option"
        autoresize
        :loading="status === 'pending'"
      >
        <template #tooltip="params">
          <div class="font-semibold">
            {{ ((params as CallbackDataParams[])[0]!.value as WLIndexType).category }} - {{ (params as CallbackDataParams[])[0]!.name }}
          </div>
          <template
            v-for="(param, index) in params"
            :key="index"
          >
            <div
              v-if="
                (isDefined(((param as CallbackDataParams).value as WLIndexType).titles) && (param as CallbackDataParams).seriesIndex === 1) ||
                (param as CallbackDataParams).seriesIndex === 0
              "
              class="flex justify-between gap-5 *:not-first:font-semibold"
            >
              <div>
                <span v-html="(param as CallbackDataParams)?.marker" />
                <span>{{ (param as CallbackDataParams).seriesName }}</span>
              </div>
              <div v-if="(param as CallbackDataParams).seriesIndex === 0">{{
                ((param as CallbackDataParams).value as WLIndexType).value.toFixed(3)
              }}</div>
              <div v-else>{{ ((param as CallbackDataParams).value as WLIndexType).titles }}</div>
            </div>
          </template>
        </template>
      </v-chart>
    </template>

    <template #footer>
      <filters-levels
        v-model="levels as LevelEnumType[]"
        orientation="horizontal"
      />

      <filters-draw-type
        v-model="drawType"
        orientation="horizontal"
      />

      <filters-years v-model="years" />
    </template>
  </u-modal>
</template>
