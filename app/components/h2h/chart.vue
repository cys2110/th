<script setup lang="ts">
const { t1Wins, t2Wins } = defineProps<{ t1Wins: number; t2Wins: number }>()
const colorMode = useColorMode()

const formattedData = computed(() => [
  { value: t1Wins, itemStyle: { color: COLOURS.violet700 } },
  { value: t2Wins, itemStyle: { color: COLOURS.emerald700 } }
])

const option = computed(() => ({
  backgroundColor: "transparent",
  darkMode: colorMode.value === "dark",
  textStyle: { color: colorMode.value === "dark" ? COLOURS.lightText : COLOURS.darkText },
  series: [
    {
      type: "pie",
      radius: ["80%", "90%"],
      data: formattedData.value,
      startAngle: 180,
      label: {
        formatter: () =>
          `${t1Wins}—${t2Wins}\n${t1Wins + t2Wins ? percentage(t1Wins, t1Wins + t2Wins) : 0}%—${
            t1Wins + t2Wins ? percentage(t2Wins, t1Wins + t2Wins) : 0
          }%`,
        position: "center",
        fontWeight: "bolder",
        fontSize: 18,
        lineHeight: 40
      }
    }
  ]
}))

const chartRef = useTemplateRef("chartRef")

onMounted(() => {
  setTimeout(() => {
    chartRef.value?.resize()
  }, 100)
})
</script>

<template>
  <div class="h-30 md:h-60 min-w-30 md:min-w-60 lg:min-w-80 w-fit mx-auto">
    <v-chart
      ref="chartRef"
      :option="option"
      :autoresize="true"
    />
  </div>
</template>
