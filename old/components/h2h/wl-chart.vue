<script setup lang="ts">
const { p1Wins, p2Wins } = defineProps<{ p1Wins: number; p2Wins: number }>()
const colorMode = useColorMode()
const { colours } = useAppConfig()

const formattedData = computed(() => [
  { value: p1Wins, itemStyle: { color: COLOURS.violet700 } },
  { value: p2Wins, itemStyle: { color: COLOURS.emerald700 } }
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
          `${p1Wins}—${p2Wins}\n${p1Wins + p2Wins ? percentage(p1Wins, p1Wins + p2Wins) : 0}%—${
            p1Wins + p2Wins ? percentage(p2Wins, p1Wins + p2Wins) : 0
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
  <div class="h-30 md:h-60 w-30 md:w-60 w-fit mx-auto">
    <v-chart
      ref="chartRef"
      :option="option"
      :autoresize="true"
    />
  </div>
</template>
