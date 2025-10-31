<script setup lang="ts">
const { finalists } = defineProps<{ finalists: TournamentFinalistType[] }>()
const { icons, colours } = useAppConfig()
const tours = inject<TourType[]>("tours", [])
const tournamentName = inject<string>("tournamentName", "")
const colorMode = useColorMode()

const selectedTour = ref<TourType | null>(null)
const datasetIndex = ref(0)

const formattedFinalists = computed(() =>
  finalists.map(finalist => ({
    ...finalist,
    player: `${finalist.player.first_name} ${finalist.player.last_name}`,
    tour: finalist.player.tour
  }))
)

watch(selectedTour, () => {
  if (selectedTour.value) {
    set(datasetIndex, 1)
  } else {
    set(datasetIndex, 0)
  }
})

const option = computed(() => ({
  backgroundColor: "transparent",
  textStyle: { color: colorMode.value === "dark" ? colours.darkText : colours.lightText },
  grid: { containLabel: true },
  tooltip: {
    trigger: "axis",
    axisPointer: { type: "shadow" }
  },
  dataset: [
    {
      source: formattedFinalists.value,
      dimensions: ["player", "finals", "singles_wins", "singles_losses", "doubles_wins", "doubles_losses", "tour"]
    },
    {
      transform: {
        type: "filter",
        config: { dimension: "tour", value: selectedTour.value }
      }
    }
  ],
  xAxis: {
    type: "value",
    axisLabel: { color: colorMode.value === "dark" ? colours.darkText : colours.lightText }
  },
  yAxis: {
    type: "category",
    inverse: true,
    axisLabel: { color: colorMode.value === "dark" ? colours.darkText : colours.lightText }
  },
  series: [
    {
      name: "Singles Wins",
      type: "bar",
      encode: { x: "singles_wins", y: "player" },
      stack: "singles",
      datasetIndex: datasetIndex.value,
      itemStyle: { color: colours.orange600 }
    },
    {
      name: "Singles Losses",
      type: "bar",
      encode: { x: "singles_losses", y: "player" },
      stack: "singles",
      datasetIndex: datasetIndex.value,
      itemStyle: { color: colours.orange300 }
    },
    {
      name: "Doubles Wins",
      type: "bar",
      encode: { x: "doubles_wins", y: "player" },
      stack: "doubles",
      datasetIndex: datasetIndex.value,
      itemStyle: { color: colours.indigo700 }
    },
    {
      name: "Doubles Losses",
      type: "bar",
      encode: { x: "doubles_losses", y: "player" },
      stack: "doubles",
      datasetIndex: datasetIndex.value,
      itemStyle: { color: colours.indigo300 }
    }
  ]
}))
</script>

<template>
  <u-modal
    :title="tournamentName"
    description="Players by Number of Finals"
    fullscreen
  >
    <u-button
      label="Chart"
      :icon="icons.barChart"
    />

    <template #body>
      <div class="flex w-full items-center justify-between">
        <u-radio-group
          v-if="tours.length > 1"
          legend="Tour"
          v-model="selectedTour"
          :items="[{ label: 'All', value: null }, ...tours.map(tour => ({ label: tour, value: tour }))]"
          orientation="horizontal"
        />
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1">
            <u-icon
              :name="icons.colours"
              class="text-orange-600"
            />
            <span class="text-sm">Singles Wins</span>
          </div>
          <div class="flex items-center gap-1">
            <u-icon
              :name="icons.colours"
              class="text-orange-300"
            />
            <span class="text-sm">Singles Losses</span>
          </div>
          <div class="flex items-center gap-1">
            <u-icon
              :name="icons.colours"
              class="text-indigo-700"
            />
            <span class="text-sm">Doubles Wins</span>
          </div>
          <div class="flex items-center gap-1">
            <u-icon
              :name="icons.colours"
              class="text-indigo-300"
            />
            <span class="text-sm">Doubles Losses</span>
          </div>
        </div>
      </div>

      <v-chart
        class="min-h-200 w-full"
        :option
        :autoresize="true"
      />
    </template>
  </u-modal>
</template>
