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

const { data: index, status } = await useFetch<WLIndexType[]>("/api/player/wl-index", {
  method: "POST",
  body: {
    id,
    levels,
    drawType,
    years
  },
  default: () => []
})

const handleSelectRow = (_e: Event, row: TableRow<WLIndexType>) => {
  if (row.getIsGrouped()) row.toggleExpanded()
}
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <players-wl-index-chart
            v-if="index.length"
            :index="index"
            :status="status"
            v-model:draw-type="drawType"
            v-model:levels="levels"
            v-model:years="years"
          />

          <u-separator />

          <filters :reset-filters>
            <filters-levels v-model="(levels as LevelEnumType[])" />

            <filters-draw-type v-model="drawType" />

            <filters-years
              v-model="years"
              multiple
            />
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
              <players-wl-index-chart
                v-if="index.length"
                :index="index"
                :status="status"
                v-model:draw-type="drawType"
                v-model:levels="levels"
                v-model:years="years"
              />

              <u-separator />

              <filters :reset-filters>
                <filters-levels v-model="(levels as LevelEnumType[])" />

                <filters-draw-type v-model="drawType" />

                <filters-years
                  v-model="years"
                  multiple
                />
              </filters>
            </template>
          </u-slideover>
        </template>
      </players-wrapper>

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
              tr: (row: TableRow<WLIndexType>) => row.getCanExpand() ? '' : 'bg-default! cursor-default!'
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
