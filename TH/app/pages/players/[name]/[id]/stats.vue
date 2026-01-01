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

const { data: stats, status } = await useFetch<PlayerStatsType[]>("/api/player/stats", {
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
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <players-stats-chart
            v-if="stats.length"
            :stats="stats"
            :status="status"
            v-model:levels="levels"
            v-model:draw-type="drawType"
            v-model:years="years"
            v-model:surfaces="surfaces"
          />

          <u-separator />

          <filters :reset-filters>
            <filters-levels v-model="(levels as LevelEnumType[])" />

            <filters-draw-type v-model="drawType" />

            <filters-years v-model="years" />

            <filters-surfaces v-model="(surfaces as string[])" />
          </filters>
        </u-page-aside>
      </template>

      <players-wrapper>
        <template #header-links>
          <u-slideover
            title="Filters"
            class="lg:hidden"
          >
            <u-button :icon="ICONS.filter" />

            <template #body>
              <players-stats-chart
                v-if="stats.length"
                :stats="stats"
                :status="status"
                v-model:levels="levels"
                v-model:draw-type="drawType"
                v-model:years="years"
                v-model:surfaces="surfaces"
              />

              <u-separator />

              <filters :reset-filters>
                <filters-levels v-model="(levels as LevelEnumType[])" />

                <filters-draw-type v-model="drawType" />

                <filters-years v-model="years" />

                <filters-surfaces v-model="(surfaces as string[])" />
              </filters>
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
