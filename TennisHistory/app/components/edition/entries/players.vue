<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues, getGroupedRowModel } from "@tanstack/vue-table"

const {
  params: { id, edId }
} = useRoute("edition")
const refreshCount = defineModel<number>("refresh-count")
const router = useRouter()

const {
  data: entries,
  status,
  refresh
} = await useFetch("/api/edition/entries/players", {
  query: { edId },
  default: () => []
})

watch(refreshCount, () => {
  refresh()
})

const columnVisibility = computed(() => {
  return {
    singles_draws: COUNTRY_DRAWS.includes(id) ? false : true,
    singles_seed: COUNTRY_DRAWS.includes(id) ? false : true,
    doubles_draws: COUNTRY_DRAWS.includes(id) ? false : true,
    doubles_seed: COUNTRY_DRAWS.includes(id) ? false : true
  }
})

const handleSelectRow = (_e: Event, row: TableRow<PlayerEntryType>) => {
  if (row.getIsGrouped()) {
    row.toggleExpanded()
  } else {
    router.push({
      name: "player",
      params: {
        id: row.original.id,
        name: row.original.first_name ? kebabCase(`${row.original.first_name} ${row.original.last_name}`) : "—"
      }
    })
  }
}
</script>

<template>
  <u-table
    :data="entries"
    :columns="playerEntryColumns(refresh)"
    :loading="status === 'pending'"
    sticky
    render-fallback-value="—"
    @select="handleSelectRow"
    v-model:column-visibility="columnVisibility"
    :faceted-options="{
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues()
    }"
    :grouping-options="{
      getGroupedRowModel: getGroupedRowModel()
    }"
    :ui="{ td: 'empty: py-0 px-2' }"
  >
    <template #loading>
      <loading-icon />
    </template>

    <template #empty>
      <empty
        message="No entries found"
        :icon="ICONS.peopleOff"
      >
        <dev-only>
          <edition-entries-update :refresh />
        </dev-only>
      </empty>
    </template>
  </u-table>
</template>
