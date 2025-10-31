<script setup lang="ts">
import { TableCellGroup, TableHeaderGroup, TableHeaderRange, TableHeaderSort, UButton } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import {
  type Column,
  createColumnHelper,
  getFacetedRowModel,
  getFacetedMinMaxValues,
  getFacetedUniqueValues,
  getGroupedRowModel,
  type GroupingOptions
} from "@tanstack/vue-table"

const playerName = useState<string>("player-name")

definePageMeta({ name: "record" })
const {
  params: { id }
} = useRoute("record")
const {
  ui: { icons }
} = useAppConfig()

// API call
const { data: results, status } = await useFetch<RecordInterface[]>("/api/players/record", {
  key: `record-${id}`,
  query: { id },
  default: () => [],
  server: false
})

const columns: TableColumn<RecordInterface>[] = [
  {
    id: "tournament",
    accessorKey: "tournament.name",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) =>
      h(TableHeaderGroup, {
        column: column as Column<unknown>,
        label: "Tournament"
      }),
    cell: ({ row, cell }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "tournament" }, () => cell.getValue() as string)
  },
  {
    accessorKey: "year",
    header: ({ column }) =>
      h(TableHeaderRange, {
        column: column as Column<unknown>,
        label: "Year"
      }),
    cell: ({ row, cell }) => {
      if (!row.getIsGrouped()) {
        return cell.getValue()
      }
    }
  },
  {
    accessorKey: "singles.number",
    header: ({ column }) =>
      h(TableHeaderSort, {
        column: column as Column<unknown>,
        label: "Singles",
        type: "number"
      }),
    cell: ({ row }) => {
      if (!row.getIsGrouped()) {
        return h(
          "span",
          {
            class: row.original.singles?.number === 0 ? "text-success uppercase" : ""
          },
          row.original.singles?.round
        )
      }
    }
  },
  {
    accessorKey: "doubles.number",
    header: ({ column }) =>
      h(TableHeaderSort, {
        column: column as Column<unknown>,
        label: "Doubles",
        type: "number"
      }),
    cell: ({ row }) => {
      if (!row.getIsGrouped()) {
        return h(
          "span",
          {
            class: row.original.doubles?.number === 0 ? "text-success uppercase" : ""
          },
          row.original.doubles?.round
        )
      }
    }
  }
]

const grouping = ref<string[]>([])

const grouping_options = ref<GroupingOptions>({
  getGroupedRowModel: getGroupedRowModel()
})

const table = useTemplateRef("table")

const handleSelectRow = async (row: TableRow<EventInterface>) => {
  if (row.getIsGrouped()) {
    await navigateTo({
      name: "tournament",
      params: { id: row.original.tournament.id, name: kebabCase(row.original.tournament.name) }
    })
  } else {
    await navigateTo({
      name: "event",
      params: { id: row.original.tournament.id, name: kebabCase(row.original.tournament.name), year: row.original.year, eid: row.original.id }
    })
  }
}
</script>

<template>
  <player-wrapper>
    <template #toolbar>
      <u-button
        label="Reset Sorting"
        :icon="ICONS.sortAlpha"
        @click="table?.tableApi.resetSorting()"
        size="sm"
      />
      <u-button
        label="Reset Grouping"
        :icon="ICONS.ungroup"
        @click="table?.tableApi.resetGrouping()"
        size="sm"
      />
      <u-button
        label="Reset Filters"
        :icon="ICONS.noFilter"
        @click="table?.tableApi.resetColumnFilters()"
        size="sm"
      />
      <table-visibility
        v-if="table"
        :table="table!"
      />
    </template>

    <u-table
      ref="table"
      :data="results"
      :columns
      :loading="['idle', 'pending'].includes(status)"
      sticky
      :faceted-options="{
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
        getFacetedUniqueValues: getFacetedUniqueValues()
      }"
      :grouping="grouping"
      v-on:update:grouping="grouping = $event"
      :grouping-options="grouping_options"
      @select="handleSelectRow"
      :ui="{ root: 'w-fit min-w-1/3 mx-auto', tbody: '[&>tr]:cursor-pointer', td: 'empty:p-0' }"
    >
      <template #loading>
        <table-loading-icon />
      </template>

      <template #empty>
        <table-empty-message
          :message="`No record found for ${playerName}`"
          :icon="ICONS.noTournament"
        />
      </template>
    </u-table>
  </player-wrapper>
</template>
