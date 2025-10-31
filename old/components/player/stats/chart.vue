<script setup lang="ts">
const { stats, tour, firstName, lastName } = defineProps<{ stats: PlayerStatsType[]; tour: TourType; firstName: string; lastName: string }>()
const { icons, colours } = useAppConfig()
const route = useRoute()
const colorMode = useColorMode()

const option = ref({
  backgroundColor: "transparent",
  textStyle: { color: colorMode.value === "dark" ? colours.darkText : colours.lightText },
  grid: { containLabel: true },
  dataset: {
    source: stats,
    dimensions: ["category", "value"]
  },
  tooltip: {
    formatter: function (params: any) {
      return `
        <div class="flex justify-between gap-5">
          <span class="font-semibold">${params.data.category}</span>
          <span class="font-extrabold">${params.value.value}${params.data.suffix === false ? "" : "%"}</span>
        </div>
      `
    }
  },
  xAxis: {
    type: "value",
    max: 100,
    splitLine: {
      lineStyle: { color: colorMode.value === "dark" ? colours.lightText : colours.darkText }
    },
    axisLabel: { formatter: "{value}%" }
  },
  yAxis: { type: "category", inverse: true },
  series: [
    {
      type: "bar",
      encode: { x: "value", y: "category" },
      itemStyle: { color: tour === "ATP" ? colours.sky700 : colours.fuchsia600 }
    }
  ]
})
</script>

<template>
  <u-modal
    :title="`${firstName} ${lastName}`"
    description="Stats"
    fullscreen
  >
    <u-button
      label="Chart view"
      :icon="icons.barChart"
      size="sm"
    />

    <template #body>
      <v-chart
        class="min-h-200 w-full"
        :option
        :autoresize="true"
      />
    </template>
  </u-modal>
</template>
