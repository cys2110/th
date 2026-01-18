<script setup lang="ts">
definePageMeta({ name: "stats" })

const {
  params: { id }
} = useRoute("stats")
const playerStore = usePlayerStore()

// Filters
const levels = useRouteQuery("levels", null, { transform: val => toArray(val) })
const drawType = useRouteQuery<DrawEnumType>("draw", undefined)
const years = useRouteQuery("years", null, { transform: val => toArray(val)?.map(Number) })
const surfaces = useRouteQuery("surfaces", null, { transform: val => toArray(val) })

const resetFilters = () => {
  set(levels, null)
  set(drawType, undefined)
  set(years, null)
  set(surfaces, null)
}

const {
  data: stats,
  status,
  error
} = await useFetch<PlayerStatsType[]>("/api/player/stats", {
  method: "POST",
  body: {
    id,
    levels,
    drawType,
    years,
    surfaces
  },
  default: () => []
})

watch(
  error,
  () => {
    if (error.value) {
      if (error.value.statusMessage === "Validation errors") {
        console.error(error.value.statusMessage, error.value.data?.data.validationErrors)
      } else {
        console.error(error.value)
      }
    }
  },
  { immediate: true }
)
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <player-stats-chart
            :stats="stats"
            :status="status"
            v-model:levels="levels"
            v-model:draw-type="drawType"
            v-model:years="years"
            v-model:surfaces="surfaces"
          />

          <u-separator />

          <filters :reset-filters>
            <filters-levels v-model="levels as LevelEnumType[]" />

            <filters-draw-type v-model="drawType" />

            <filters-years
              v-model="years"
              multiple
            />

            <filters-surfaces v-model="surfaces as string[]" />
          </filters>
        </u-page-aside>
      </template>

      <player-wrapper>
        <!-- <template #header-links> -->
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
        </template>-->
      </player-wrapper>

      <u-page-body>
        <u-table
          :data="stats"
          :columns="playerStatsColumns"
          :loading="status === 'pending'"
          sticky
        >
          <template #loading>
            <loading-icon />
          </template>
          <template #empty>
            <empty :message="`${playerStore.fullName} has not played any matches with stats available for the selected filters.`" />
          </template>
        </u-table>
      </u-page-body>
    </u-page>
  </u-container>
</template>
