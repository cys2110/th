<script setup lang="ts">
definePageMeta({ name: "stats" })

const {
  params: { id }
} = useRoute("stats")

// Filters
const levels = ref([])
const drawType = ref<DrawEnumType>()
const years = ref([])
const surfaces = ref([])

const resetFilters = () => {
  levels.value = []
  drawType.value = undefined
  years.value = []
  surfaces.value = []
}

// const { data: stats, status } = await useFetch<PlayerStatsType[]>("/api/players/stats", {
//   method: "POST",
//   body: {
//     id,
//     levels,
//     drawType,
//     years,
//     surfaces
//   },
//   default: () => []
// })
</script>

<template>
  <u-container>
    <!-- <u-page>
      <template #left>
        <u-page-aside>
          <players-stats-chart
            :stats="stats.filter(s => s.percent)"
            :levels
            :draw-type
            :years
            :surfaces
          />

          <u-separator />

          <filters
            :filters="['levels', 'draw', 'surfaces', 'years']"
            v-model:levels="levels"
            v-model:draw="drawType"
            v-model:surfaces="surfaces"
            v-model:years="years"
            :reset-filters
          />
        </u-page-aside>
      </template>

      <players-wrapper>
        <template #header-links>-->
    <!--Filters for smaller screens-->
    <!--<u-slideover
            title="Filters"
            class="ml-auto lg:hidden"
          >
            <u-button :icon="ICONS.filter" />
            <template #body>
              <filters
                :filters="['levels', 'draw', 'surfaces', 'years']"
                v-model:levels="levels"
                v-model:draw="drawType"
                v-model:surfaces="surfaces"
                v-model:years="years"
                :reset-filters
              />
            </template>
          </u-slideover>
        </template>
      </players-wrapper>

      <u-page-body>
        <u-table
          :data="stats"
          :columns="playerStatsColumns"
          :loading="status === 'pending'"
          sticky
          :ui="{ root: 'w-fit min-w-1/3 mx-auto max-h-150' }"
        >
          <template #loading>
            <loading-icon />
          </template>
          <template #empty>
            <empty
              message="No stats available"
              class="mx-2"
            />
          </template>
        </u-table>
      </u-page-body>
    </u-page> -->
  </u-container>
</template>
