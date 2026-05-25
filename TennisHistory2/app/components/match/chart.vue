<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"

const props = withDefaults(
  defineProps<{
    category: string
    label?: string
    stats: MatchStatsType["stats"]
    status: AsyncDataRequestStatus
  }>(),
  {
    label: "Chart"
  }
)

const {
  params: { year }
} = useRoute("match")
const matchStore = useMatchStore()

// Chart configuration
const themeKey = inject(THEME_KEY)

const theme = computed(() => {
  const key = themeKey as keyof typeof COLOURS
  return COLOURS[key] ?? COLOURS.dark
})

const option = ref({
  backgroundColor: "transparent",
  grid: { containLabel: true },
  textStyle: { color: theme.value.slate },
  dataset: {
    source: props.stats,
    dimensions: ["label", "t1", "t1_pc", "t2", "t2_pc"]
  },
  tooltip: {
    trigger: "axis"
  },
  xAxis: { type: "value", max: 100, axisLabel: { formatter: "{value}%" } },
  yAxis: { type: "category", inverse: true },
  series: [
    {
      name: matchStore.team1Name,
      type: "bar",
      encode: { x: "t1_pc", y: "label" },
      itemStyle: { color: theme.value.violet, borderRadius: [0, 25, 25, 0] },
      label: {
        show: true,
        formatter: "{a}"
      }
    },
    {
      name: matchStore.team2Name,
      type: "bar",
      encode: { x: "t2_pc", y: "label" },
      itemStyle: { color: theme.value.emerald, borderRadius: [0, 25, 25, 0] },
      label: {
        show: true,
        formatter: "{a}"
      }
    }
  ]
})

const getButtonColour = (category: string) => {
  switch (category) {
    case "Service Stats":
      return "Active"
    case "Return Stats":
      return "Inactive"
    case "Points Stats":
      return "ITF"
    case "Service Speed":
      return "Challenger"
    default:
      return "primary"
  }
}

const nonPercentCategories = ["Aces", "Double Faults", "Winners", "Unforced Errors"]
</script>

<template>
  <u-modal
    :title="`${matchStore.name} ${year}`"
    :description="category"
    fullscreen
  >
    <u-button
      :label
      :icon="ICONS.barChart"
      block
      :color="getButtonColour(category)"
    />

    <template #body>
      <v-chart
        class="min-h-100 w-full"
        :theme="themeKey || 'dark'"
        :option="option"
        autoresize
        :loading="status === 'pending'"
      >
        <template #tooltip="params">
          <div class="flex flex-col gap-2">
            <div class="font-semibold">{{ (params as any)[0].data.label }}</div>
            <div
              v-for="(param, index) in params"
              :key="index"
              class="flex justify-between gap-5"
            >
              <div class="flex items-center">
                <span v-html="(param as any).marker" />
                <span>{{ index === 0 ? matchStore.team1Name : matchStore.team2Name }}</span>
              </div>
              <div class="font-semibold flex items-center gap-1">
                <span>{{ (param as any).data[`t${(index as number) + 1}`] }}</span>
                <span v-if="!nonPercentCategories.includes((param as any).data.label)">
                  ({{ (param as any).data[`t${(index as number) + 1}_pc`] }}%)
                </span>
              </div>
            </div>
          </div>
        </template>
      </v-chart>
    </template>
  </u-modal>
</template>
