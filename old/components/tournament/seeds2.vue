<script setup lang="ts">
import { ColouredBadge, CountryLink, TableHeaderFilter, TableHeaderName, TableHeaderRange, ULink } from "#components"
import type { TableColumn } from "@nuxt/ui"
import { type Column, createColumnHelper, getFacetedRowModel, getFacetedMinMaxValues, getFacetedUniqueValues } from "@tanstack/vue-table"

const {
  params: { id, name }
} = useRoute("tournament")
const {
  ui: { icons }
} = useAppConfig()
const tours = inject<TourType[]>("tours", [])
const tournamentName = inject<string>("tournamentName", "")

// API call
const { data: results, status } = await useFetch<TournamentSeedType[]>("/api/tournaments/seeds", {
  key: `tournament-seeds-${id}`,
  query: { id },
  default: () => [],
  server: false
})

const columnHelper = createColumnHelper<TournamentSeedType["teams"][number]>()

const gridColumns: TableColumn<TournamentSeedType["teams"][number]>[] = [
  { accessorKey: "seed", header: "Seed" },
  columnHelper.group({
    header: "Players",
    columns: [
      {
        id: "country",
        accessorFn: row => row.players.map(p => p.country.name),
        filterFn: "arrIncludesSome",
        header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Country" }),
        cell: ({ row }) => row.original.players.map(p => h(CountryLink, { country: p.country, class: "mx-auto" }))
      },
      {
        id: "name",
        accessorFn: row => row.players.map(p => `${p.last_name}, ${p.first_name}`),
        filterFn: (row, columnId, filterValue) => filterIncludesName(row, columnId, filterValue),
        header: ({ column }) => h(TableHeaderName, { column: column as Column<unknown>, label: "Name" }),
        cell: ({ row }) =>
          h(
            "div",
            { class: "flex flex-col items-center" },
            row.original.players.map(p =>
              h(
                ULink,
                {
                  to: { name: "player", params: { id: p.id, name: kebabCase(`${p.first_name}-${p.last_name}`) } },
                  class: "hover-link default-link w-fit"
                },
                () => `${p.first_name} ${p.last_name}`
              )
            )
          )
      }
    ]
  })
]

const columns: TableColumn<TournamentSeedType>[] = [
  {
    accessorKey: "year",
    meta: { class: { td: "font-semibold" } },
    header: ({ column }) => h(TableHeaderRange, { column: column as Column<unknown>, label: "Year" })
  },
  {
    accessorKey: "tour",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Tour" }),
    cell: ({ row }) => h(ColouredBadge, { label: row.original.tour, class: "mx-auto" })
  },
  {
    accessorKey: "type",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Type" }),
    cell: ({ row }) => h(ColouredBadge, { label: row.original.type, class: "mx-auto" })
  },
  {
    accessorKey: "round",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Round" })
  }
]

const table = useTemplateRef("table")
const columnVisibility = ref({
  tour: tours.length > 1
})
</script>

<template>
  <div class="flex items-center justify-between mb-5">
    <u-button
      label="Reset Sorting"
      :icon="ICONS.sortAlpha"
      @click="table?.tableApi.resetSorting()"
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
  </div>
  <u-table
    ref="table"
    :data="useSorted(results, (a, b) => b.year - a.year).value"
    :columns
    :loading="['idle', 'pending'].includes(status)"
    sticky
    :faceted-options="{
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedMinMaxValues: getFacetedMinMaxValues(),
      getFacetedUniqueValues: getFacetedUniqueValues()
    }"
    v-model:column-visibility="columnVisibility"
    :ui="{ td: 'empty:p-0' }"
  >
    <template #loading>
      <table-loading-icon />
    </template>

    <template #empty>
      <table-empty-message
        :icon="ICONS.noPlayer"
        :message="`No years when the top seeds reached the later rounds of ${tournamentName}`"
      />
    </template>

    <template #year-cell="{ row }">
      <div class="flex justify-center items-center gap-2">
        <u-button
          variant="link"
          color="neutral"
          class="mr-2"
          size="xs"
          :icon="icons.chevronDoubleRight"
          :ui="{
            leadingIcon: row.getIsExpanded() ? 'rotate-90 transition-transform duration-200' : 'transition-transform duration-200',
            label: 'font-semibold'
          }"
          @click="row.toggleExpanded()"
        />

        <u-link
          :to="{ name: 'event', params: { id, name, year: row.original.year, eid: row.original.id } }"
          class="hover-link default-link font-semibold"
        >
          {{ row.original.year }}
        </u-link>
      </div>
    </template>

    <template #expanded="{ row }">
      <u-table
        :data="row.original.teams"
        :columns="gridColumns"
        class="w-fit mx-auto"
      />
    </template>
  </u-table>
</template>
