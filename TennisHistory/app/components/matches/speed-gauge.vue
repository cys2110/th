<script setup lang="ts">
const { stat } = defineProps<{
  stat: MatchStatsType["stats"][number]
}>()
const colorMode = useColorMode()

const kmhData = [
  {
    value: stat.t1,
    name: stat.label,
    title: {
      offsetCenter: ["0%", "100%"],
      color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText
    },
    detail: {
      offsetCenter: ["-100%", "100%"],
      color: COLOURS.indigo700,
      borderColor: COLOURS.indigo700
    },
    itemStyle: { color: COLOURS.indigo700 }
  },
  {
    value: stat.t2,
    itemStyle: { color: COLOURS.fuchsia600 },
    detail: {
      offsetCenter: ["100%", "100%"],
      color: COLOURS.fuchsia600,
      borderColor: COLOURS.fuchsia600
    }
  }
]

const option = ref({
  darkMode: colorMode.value === "dark",
  backgroundColor: "transparent",
  series: [
    {
      type: "gauge",
      data: kmhData,
      max: 300,
      axisLine: { show: false },
      axisLabel: {
        distance: 25,
        color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText
      },
      title: { fontSize: 14 },
      detail: {
        width: 60,
        height: 40,
        fontSize: 14,
        lineHeight: 15,
        color: "inherit",
        borderColor: "inherit",
        borderRadius: 10,
        borderWidth: 1,
        formatter: function (value: any) {
          const milesPerHour = kmhToMph(value).toFixed(0)
          return `${value} km/h\n${milesPerHour} mph`
        }
      }
    }
  ]
})
</script>

<template>
  <v-chart
    class="min-h-200 w-full"
    :option
    :autoresize="true"
  />
</template>
