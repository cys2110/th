<script setup lang="ts">
import type { GroupingOptions } from "@tanstack/vue-table"
import { getGroupedRowModel } from "@tanstack/vue-table"

const {
  params: { edId }
} = useRoute("edition")

const {
  data: entries,
  status,
  refresh
} = await useFetch("/api/editions/entries/teams", {
  query: { edId },
  default: () => []
})

const columnPinning = ref({
  left: ["expand", "team"],
  right: []
})

const grouping = ref<string[]>([])
const grouping_options = ref<GroupingOptions>({
  groupedColumnMode: "remove",
  getGroupedRowModel: getGroupedRowModel()
})
</script>

<template>
  <u-table
    :data="entries"
    :columns="teamsColumns"
    :loading="status === 'pending'"
    :grouping
    :grouping-options="grouping_options"
    sticky
    render-fallback-value="—"
    v-model:column-pinning="columnPinning"
    :ui="{
      root: 'max-h-150',
      td: 'empty: p-0'
    }"
  >
    <template #loading>
      <loading-icon />
    </template>

    <template #empty>
      <empty
        message="No entries found"
        :icon="ICONS.noPeople"
        class="mx-2"
      >
        <dev-only>
          <editions-entries-update :refresh />
        </dev-only>
      </empty>
    </template>
  </u-table>
</template>
