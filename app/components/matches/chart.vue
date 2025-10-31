<script setup lang="ts">
const {
  stats,
  t1,
  t2,
  label = "Chart"
} = defineProps<{
  category: string
  label?: string
  stats: MatchInterface["match_stats"]
  t1: EntryInterface
  t2: EntryInterface
  tournament: string
}>()
const colorMode = useColorMode()
const { params } = useRoute()
const { year } = params as { year?: string }

const option = ref({
  backgroundColor: "transparent",
  grid: { containLabel: true },
  textStyle: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText },
  dataset: {
    source: stats,
    dimensions: ["label", "t1", "t1_pc", "t2", "t2_pc"]
  },
  tooltip: {
    trigger: "axis",
    formatter: (params: any) => {
      return `
        <div class="flex flex-col gap-2">
          <div class="flex justify-between gap-5">
            <div class="flex items-center font-bold">
              ${params[0].marker}
              ${t1.players.map(player => `${player.first_name} ${player.last_name}`).join(" | ")}
            </div>
            <div class='font-semibold'>${params[0].data.t1} (${params[0].data.t1_pc}%)</div>
          </div>
          <div class="flex justify-between gap-5">
            <div class="flex items-center font-bold">
              ${params[1].marker}
              ${t2.players.map(player => `${player.first_name} ${player.last_name}`).join(" | ")}
            </div>
            <div class='font-semibold'>${params[1].data.t2} (${params[1].data.t2_pc}%)</div>
          </div>
        </div>
      `
    }
  },
  xAxis: { type: "value", max: 100, axisLabel: { formatter: "{value}%" } },
  yAxis: { type: "category", inverse: true },
  series: [
    {
      name: t1.players.map(player => `${player.first_name} ${player.last_name}`).join(" | "),
      type: "bar",
      encode: { x: "t1_pc", y: "label" },
      itemStyle: { color: COLOURS.indigo700 },
      label: {
        show: true,
        color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText,
        formatter: "{a}"
      }
    },
    {
      name: t2.players.map(player => `${player.first_name} ${player.last_name}`).join(" | "),
      type: "bar",
      encode: { x: "t2_pc", y: "label" },
      itemStyle: { color: COLOURS.fuchsia600 },
      label: {
        show: true,
        color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText,
        formatter: "{a}"
      }
    }
  ]
})

const getButtonColour = (category: string) => {
  switch (category) {
    case "Service Stats":
      return "Men"
    case "Return Stats":
      return "Women"
    case "Points Stats":
      return "primary"
    case "Service Speed":
      return "Main"
    default:
      return "neutral"
  }
}
</script>

<template>
  <u-modal
    :title="`${tournament} ${year}`"
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
        class="h-200 w-full"
        :option="option"
        :autoresize="true"
      />
    </template>
  </u-modal>
</template>
