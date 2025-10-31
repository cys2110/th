<script setup lang="ts">
import {
  ColouredBadge,
  CountryLink,
  TableCellGroup,
  TableHeaderFilter,
  TableHeaderGroup,
  TableHeaderName,
  TableHeaderRange,
  UBadge,
  UButton,
  ULink
} from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import { type Column, getFacetedRowModel, getFacetedUniqueValues, getGroupedRowModel, type GroupingOptions } from "@tanstack/vue-table"

const {
  ui: { icons, colors }
} = useAppConfig()
const {
  params: { id, name }
} = useRoute("country")

const levelBadgeMapping: Record<string, keyof typeof colors> = {
  "Grand Slam": "primary",
  Masters: "success",
  "Year End Finals": "itf",
  Olympics: "warning"
}

const countryName = useState<string>("country-name")

type APIResponseType = {
  event: EventInterface & { type: MatchType }
  player: PlayerInterface
}

// API call
const { data: results, status } = await useFetch<APIResponseType[]>("/api/countries/big-titles", {
  query: { id },
  default: () => [],
  server: false
})

const columns = computed<TableColumn<APIResponseType>[]>(() => [
  {
    id: "tour",
    accessorKey: "player.tour",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Tour" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "tour" }, () =>
        h(ColouredBadge, { label: row.getValue("tour") as string, class: "mx-auto" })
      )
  },
  {
    id: "country",
    accessorFn: row => row.player.country.name,
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Country" }),
    cell: ({ row }) => {
      if (!row.getIsGrouped() || grouping.value.length === 0) {
        return h(CountryLink, {
          country: row.original.player.country,
          class: "mx-auto",
          iconOnly: true
        })
      }
    }
  },
  {
    id: "name",
    accessorFn: row => `${row.player.last_name}, ${row.player.first_name}`,
    filterFn: (row, columnId, filterValue) => filterIncludesNameString(row, columnId, filterValue),
    aggregationFn: "uniqueCount",
    header: ({ column }) => h(TableHeaderName, { column: column as Column<unknown>, label: "Name" }),
    cell: ({ row }) => {
      if (!row.getIsGrouped() || grouping.value.length === 0) {
        return h(
          ULink,
          {
            to: {
              name: "player",
              params: { id: row.original.player.id, name: kebabCase(`${row.original.player.first_name} ${row.original.player.last_name}`) }
            },
            class: "hover-link default-link w-fit"
          },
          () => `${row.original.player.first_name} ${row.original.player.last_name}`
        )
      } else if (row.getIsGrouped()) {
        return `${row.getValue("name")} players`
      }
    }
  },
  {
    id: "type",
    accessorKey: "event.type",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "S/D" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "type" }, () =>
        h(ColouredBadge, { label: row.getValue("type") as string, class: "mx-auto" })
      )
  },
  {
    id: "level",
    accessorFn: row =>
      row.event.category === "Grand Slam"
        ? "Grand Slam"
        : row.event.category === "Olympics"
        ? "Olympics"
        : (row.event.atp_category && MASTERS_CATEGORIES.includes(row.event.atp_category)) ||
          (row.event.wta_category && MASTERS_CATEGORIES.includes(row.event.wta_category))
        ? "Masters"
        : "Year End Finals",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Level" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "level" }, () =>
        h(UBadge, {
          label: row.getValue("level") as string,
          color: levelBadgeMapping[row.getValue("level") as keyof typeof levelBadgeMapping] || "neutral",
          class: "mx-auto"
        })
      )
  },
  {
    id: "category",
    accessorFn: row => row.event.category ?? (row.player.tour === "ATP" ? row.event.atp_category : row.event.wta_category),
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Category" }),
    cell: ({ row }) =>
      h(
        TableCellGroup,
        { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "category" },
        () => row.getValue("category") as string
      )
  },
  {
    id: "tournament",
    accessorKey: "event.tournament.name",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    aggregationFn: "count",
    header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Tournament" }),
    cell: ({ row }) => {
      if (!row.getIsGrouped() || grouping.value.length === 0) {
        return h(
          ULink,
          {
            to: {
              name: "tournament",
              params: { id: row.original.event.tournament.id, name: kebabCase(row.original.event.tournament.name) }
            },
            class: "hover-link default-link w-fit"
          },
          () => row.original.event.tournament.name
        )
      } else if (row.getIsGrouped()) {
        return `${row.getValue("tournament")} tournaments`
      }
    }
  },
  {
    id: "year",
    accessorKey: "event.year",
    header: ({ column }) => h(TableHeaderRange, { column: column as Column<unknown>, label: "Year" }),
    cell: ({ row }) => {
      if (!row.getIsGrouped() || grouping.value.length === 0) {
        return h(
          ULink,
          {
            to: {
              name: "event",
              params: {
                id: row.original.event.tournament.id,
                name: kebabCase(row.original.event.tournament.name),
                year: row.original.event.year,
                eid: row.original.event.id
              }
            },
            class: "hover-link default-link w-fit"
          },
          () => row.original.event.year
        )
      }
    }
  }
])

const grouping = ref<string[]>([])
const grouping_options = ref<GroupingOptions>({
  getGroupedRowModel: getGroupedRowModel()
})
const table = useTemplateRef("table")
</script>

<template>
  <dashboard-subpanel
    :title="`Players who have won big titles representing ${countryName || capitalCase(name as string)}`"
    :icon="ICONS.tournament"
    id="big-titles"
  >
    <template #right>
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
        getFacetedUniqueValues: getFacetedUniqueValues()
      }"
      :grouping="grouping"
      v-on:update:grouping="grouping = $event"
      :grouping-options="grouping_options"
      :ui="{ root: 'w-fit min-w-1/3 mx-auto', td: 'empty:p-0' }"
    >
      <template #loading>
        <table-loading-icon />
      </template>

      <template #empty>
        <table-empty-message
          :icon="ICONS.noTournament"
          :message="`No players have won big titles representing ${countryName || capitalCase(name as string)}`"
        />
      </template>
    </u-table>
  </dashboard-subpanel>
</template>
