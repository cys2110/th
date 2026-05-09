<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"
import { getGroupedRowModel } from "@tanstack/table-core"

definePageMeta({ name: "wl-index" })

const {
  params: { id }
} = useRoute("wl-index")
const playerStore = usePlayerStore()

// Filters
const levels = useRouteQuery("levels", null, { transform: val => toArray(val) })
const drawType = useRouteQuery<DrawEnumType>("draw", undefined)
const years = useRouteQuery("years", null, { transform: val => toArray(val)?.map(Number) })

const resetFilters = () => {
  set(levels, null)
  set(drawType, undefined)
  set(years, null)
}

const {
  data: index,
  status,
  error
} = await useFetch<WLIndexType[]>("/api/player/wl-index", {
  method: "POST",
  body: {
    id,
    levels,
    drawType,
    years
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

const handleSelectRow = (_e: Event, row: TableRow<WLIndexType>) => {
  if (row.getIsGrouped()) row.toggleExpanded()
}
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <player-wl-index-chart
            v-if="index.length"
            :index="index"
            :status="status"
            v-model:draw-type="drawType"
            v-model:levels="levels"
            v-model:years="years"
          />

          <u-separator />

          <filters :reset-filters>
            <filters-levels v-model="levels as LevelEnumType[]" />

            <filters-draw-type v-model="drawType" />

            <filters-years
              v-model="years"
              multiple
            />
          </filters>
        </u-page-aside>
      </template>

      <player-wrapper>
        <template #header-links>
          <u-slideover
            title="Filters"
            class="lg:hidden"
          >
            <u-button :icon="ICONS.filter" />

            <template #body>
              <filters :reset-filters>
                <filters-levels v-model="levels as LevelEnumType[]" />

                <filters-draw-type v-model="drawType" />

                <filters-years
                  v-model="years"
                  multiple
                />
              </filters>
            </template>
          </u-slideover>
        </template>
      </player-wrapper>

      <u-page-body>
        <u-table
          :data="index"
          :columns="wlIndexColumns"
          :loading="status === 'pending'"
          sticky
          @select="handleSelectRow"
          :grouping="['category']"
          :grouping-options="{
            getGroupedRowModel: getGroupedRowModel()
          }"
          :meta="{
            class: {
              tr: (row: TableRow<WLIndexType>) => (row.getCanExpand() ? '' : 'bg-default! cursor-default!')
            }
          }"
          :ui="{ td: 'empty:p-0' }"
        >
          <template #loading>
            <loading-icon />
          </template>
          <template #empty>
            <empty :message="`${playerStore.fullName} has not played any matches for the selected filters.`" />
          </template>
        </u-table>
      </u-page-body>
    </u-page>
  </u-container>
</template>
