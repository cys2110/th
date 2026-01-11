<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues, getGroupedRowModel } from "@tanstack/vue-table"

const {
  params: { edId }
} = useRoute("edition")
const toast = useToast()

const {
  data: entries,
  status,
  refresh
} = await useFetch("/api/edition/entries/teams", {
  query: { edId },
  default: () => [],
  onResponseError: ({ error }) => console.error("Error fetching edition team entries:", error)
})

const handleSelectRow = (_e: Event, row: TableRow<TeamEntryType>) => {
  toast.clear()

  if (row.getIsGrouped()) {
    row.toggleExpanded()
  } else {
    toast.add({
      title: "Go to...",
      duration: Infinity,
      progress: false,
      actions: row.original.team.map(p => ({
        label: `${p.first_name} ${p.last_name}`,
        icon: ICONS.player,
        to: {
          name: "player",
          params: {
            id: p.id,
            name: p.first_name ? kebabCase(`${p.first_name} ${p.last_name}`) : "—"
          }
        }
      }))
    })
  }
}

onUnmounted(() => {
  toast.clear()
})
onBeforeRouteLeave(() => {
  toast.clear()
})
</script>

<template>
  <u-table
    :data="entries"
    :columns="teamEntryColumns"
    :loading="status === 'pending'"
    @select="handleSelectRow"
    :faceted-options="{
      getFacetedUniqueValues: getFacetedUniqueValues(),
      getFacetedRowModel: getFacetedRowModel()
    }"
    :grouping-options="{
      getGroupedRowModel: getGroupedRowModel()
    }"
    sticky
    render-fallback-value="—"
    :ui="{ td: 'empty: p-0' }"
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
