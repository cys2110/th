<script setup lang="ts">
const {
  stats,
  t1,
  t2,
  label = "Chart"
} = defineProps<{
  category: string
  label?: string
  stats: MatchStatsType["stats"]
  t1: MatchStatsType["t1"]
  t2: MatchStatsType["t2"]
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
              ${t1?.team.map(player => `${player.first_name} ${player.last_name}`).join(" | ")}
            </div>
            <div class='font-semibold'>${params[0].data.t1} (${params[0].data.t1_pc}%)</div>
          </div>
          <div class="flex justify-between gap-5">
            <div class="flex items-center font-bold">
              ${params[1].marker}
              ${t2?.team.map(player => `${player.first_name} ${player.last_name}`).join(" | ")}
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
      name: t1?.team.map(player => `${player.first_name} ${player.last_name}`).join(" | "),
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
      name: t2?.team.map(player => `${player.first_name} ${player.last_name}`).join(" | "),
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
