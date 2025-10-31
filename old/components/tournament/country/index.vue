<script setup lang="ts">
import { CountryLink, TableHeaderFilter, TableHeaderSort, UBadge } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import { type Column, createColumnHelper, getFacetedRowModel, getFacetedMinMaxValues, getFacetedUniqueValues } from "@tanstack/vue-table"

const {
  params: { id }
} = useRoute("tournament")
const {
  ui: { icons }
} = useAppConfig()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: 1024 })
const mdAndUp = breakpoints.greaterOrEqual("md")
const tours = inject<TourType[]>("tours", [])
const tournamentName = inject<string>("tournamentName", "")

// API call
const { data: countries, status } = await useFetch<TournamentCountryType[]>("/api/tournaments/country", {
  key: `tournament-country-${id}`,
  query: { id },
  default: () => [],
  server: false
})

const columnHelper = createColumnHelper<TournamentCountryType>()

const columns: TableColumn<TournamentCountryType>[] = [
  {
    accessorKey: "country.name",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) =>
      h(TableHeaderFilter, {
        column: column as Column<unknown>,
        label: "Country",
        type: "alpha"
      }),
    cell: ({ row }) =>
      h(CountryLink, {
        country: row.original.country,
        iconOnly: false,
        class: "mx-auto"
      })
  },
  columnHelper.group({
    header: "Individual Winners",
    columns: [
      columnHelper.group({
        id: "distinct_atp",
        header: () => h(UBadge, { color: "atp", label: "ATP", class: "font-semibold" }),
        columns: [
          {
            accessorKey: "atp_singles_wins",
            header: ({ column }) =>
              h(
                "div",
                {
                  class: "flex items-center gap-2"
                },
                [
                  h(TableHeaderSort, {
                    column: column as Column<unknown>,
                    type: "number"
                  }),
                  h(UBadge, {
                    color: "singles",
                    label: "Singles",
                    class: "font-semibold"
                  })
                ]
              )
          },
          {
            accessorKey: "atp_doubles_wins",
            header: ({ column }) =>
              h(
                "div",
                {
                  class: "flex items-center gap-2"
                },
                [
                  h(TableHeaderSort, {
                    column: column as Column<unknown>,
                    type: "number"
                  }),
                  h(UBadge, {
                    color: "doubles",
                    label: "Doubles",
                    class: "font-semibold"
                  })
                ]
              )
          },
          {
            id: "distinct_total_atp",
            accessorFn: row => row.atp_singles_wins + row.atp_doubles_wins,
            header: ({ column }) =>
              h(
                "div",
                {
                  class: "flex items-center gap-2"
                },
                [
                  h(TableHeaderSort, {
                    column: column as Column<unknown>,
                    type: "number"
                  }),
                  h(UBadge, {
                    color: "active",
                    label: "Total",
                    class: "font-semibold"
                  })
                ]
              )
          }
        ]
      }),
      columnHelper.group({
        id: "distinct_wta",
        header: () => h(UBadge, { color: "wta", label: "WTA", class: "font-semibold" }),
        columns: [
          {
            accessorKey: "wta_singles_wins",
            header: ({ column }) =>
              h(
                "div",
                {
                  class: "flex items-center gap-2"
                },
                [
                  h(TableHeaderSort, {
                    column: column as Column<unknown>,
                    type: "number"
                  }),
                  h(UBadge, {
                    color: "singles",
                    label: "Singles",
                    class: "font-semibold"
                  })
                ]
              )
          },
          {
            accessorKey: "wta_doubles_wins",
            header: ({ column }) =>
              h(
                "div",
                {
                  class: "flex items-center gap-2"
                },
                [
                  h(TableHeaderSort, {
                    column: column as Column<unknown>,
                    type: "number"
                  }),
                  h(UBadge, {
                    color: "doubles",
                    label: "Doubles",
                    class: "font-semibold"
                  })
                ]
              )
          },
          {
            id: "distinct_total_wta",
            accessorFn: row => row.wta_singles_wins + row.wta_doubles_wins,
            header: ({ column }) =>
              h(
                "div",
                {
                  class: "flex items-center gap-2"
                },
                [
                  h(TableHeaderSort, {
                    column: column as Column<unknown>,
                    type: "number"
                  }),
                  h(UBadge, {
                    color: "active",
                    label: "Total",
                    class: "font-semibold"
                  })
                ]
              )
          }
        ]
      }),
      columnHelper.group({
        id: "distinct_total",
        header: () => h(UBadge, { color: "primary", label: "Total", class: "font-semibold" }),
        columns: [
          {
            id: "total_singles",
            accessorFn: row => row.atp_singles_wins + row.wta_singles_wins,
            header: ({ column }) =>
              h(
                "div",
                {
                  class: "flex items-center gap-2"
                },
                [
                  h(TableHeaderSort, {
                    column: column as Column<unknown>,
                    type: "number"
                  }),
                  h(UBadge, {
                    color: "singles",
                    label: "Singles",
                    class: "font-semibold"
                  })
                ]
              )
          },
          {
            id: "total_doubles",
            accessorFn: row => row.atp_doubles_wins + row.wta_doubles_wins,
            header: ({ column }) =>
              h(
                "div",
                {
                  class: "flex items-center gap-2"
                },
                [
                  h(TableHeaderSort, {
                    column: column as Column<unknown>,
                    type: "number"
                  }),
                  h(UBadge, {
                    color: "doubles",
                    label: "Doubles",
                    class: "font-semibold"
                  })
                ]
              )
          },
          {
            id: "distinct_all",
            accessorFn: row => row.atp_singles_wins + row.atp_doubles_wins + row.wta_singles_wins + row.wta_doubles_wins,
            header: ({ column }) =>
              h(
                "div",
                {
                  class: "flex items-center gap-2"
                },
                [
                  h(TableHeaderSort, {
                    column: column as Column<unknown>,
                    type: "number"
                  }),
                  h(UBadge, {
                    color: "active",
                    label: "Total",
                    class: "font-semibold"
                  })
                ]
              )
          }
        ]
      })
    ]
  }),
  columnHelper.group({
    header: "Total Wins",
    columns: [
      columnHelper.group({
        id: "all_atp",
        header: () => h(UBadge, { color: "atp", label: "ATP", class: "font-semibold" }),
        columns: [
          {
            accessorKey: "total_atp_singles_wins",
            header: ({ column }) =>
              h(
                "div",
                {
                  class: "flex items-center gap-2"
                },
                [
                  h(TableHeaderSort, {
                    column: column as Column<unknown>,
                    type: "number"
                  }),
                  h(UBadge, {
                    color: "singles",
                    label: "Singles",
                    class: "font-semibold"
                  })
                ]
              )
          },
          {
            accessorKey: "total_atp_doubles_wins",
            header: ({ column }) =>
              h(
                "div",
                {
                  class: "flex items-center gap-2"
                },
                [
                  h(TableHeaderSort, {
                    column: column as Column<unknown>,
                    type: "number"
                  }),
                  h(UBadge, {
                    color: "doubles",
                    label: "Doubles",
                    class: "font-semibold"
                  })
                ]
              )
          },
          {
            id: "total_atp",
            accessorFn: row => row.total_atp_singles_wins + row.total_atp_doubles_wins,
            header: ({ column }) =>
              h(
                "div",
                {
                  class: "flex items-center gap-2"
                },
                [
                  h(TableHeaderSort, {
                    column: column as Column<unknown>,
                    type: "number"
                  }),
                  h(UBadge, {
                    color: "active",
                    label: "Total",
                    class: "font-semibold"
                  })
                ]
              )
          }
        ]
      }),
      columnHelper.group({
        id: "total_wta",
        header: () => h(UBadge, { color: "wta", label: "WTA", class: "font-semibold" }),
        columns: [
          {
            accessorKey: "total_wta_singles_wins",
            header: ({ column }) =>
              h(
                "div",
                {
                  class: "flex items-center gap-2"
                },
                [
                  h(TableHeaderSort, {
                    column: column as Column<unknown>,
                    type: "number"
                  }),
                  h(UBadge, {
                    color: "singles",
                    label: "Singles",
                    class: "font-semibold"
                  })
                ]
              )
          },
          {
            accessorKey: "total_wta_doubles_wins",
            header: ({ column }) =>
              h(
                "div",
                {
                  class: "flex items-center gap-2"
                },
                [
                  h(TableHeaderSort, {
                    column: column as Column<unknown>,
                    type: "number"
                  }),
                  h(UBadge, {
                    color: "doubles",
                    label: "Doubles",
                    class: "font-semibold"
                  })
                ]
              )
          },
          {
            id: "total_wta",
            accessorFn: row => row.total_wta_singles_wins + row.total_wta_doubles_wins,
            header: ({ column }) =>
              h(
                "div",
                {
                  class: "flex items-center gap-2"
                },
                [
                  h(TableHeaderSort, {
                    column: column as Column<unknown>,
                    type: "number"
                  }),
                  h(UBadge, {
                    color: "active",
                    label: "Total",
                    class: "font-semibold"
                  })
                ]
              )
          }
        ]
      }),
      columnHelper.group({
        id: "all_total",
        header: () => h(UBadge, { color: "primary", label: "Total", class: "font-semibold" }),
        columns: [
          {
            id: "all_singles",
            accessorFn: row => row.total_atp_singles_wins + row.total_wta_singles_wins,
            header: ({ column }) =>
              h(
                "div",
                {
                  class: "flex items-center gap-2"
                },
                [
                  h(TableHeaderSort, {
                    column: column as Column<unknown>,
                    type: "number"
                  }),
                  h(UBadge, {
                    color: "singles",
                    label: "Singles",
                    class: "font-semibold"
                  })
                ]
              )
          },
          {
            id: "all_doubles",
            accessorFn: row => row.total_atp_doubles_wins + row.total_wta_doubles_wins,
            header: ({ column }) =>
              h(
                "div",
                {
                  class: "flex items-center gap-2"
                },
                [
                  h(TableHeaderSort, {
                    column: column as Column<unknown>,
                    type: "number"
                  }),
                  h(UBadge, {
                    color: "doubles",
                    label: "Doubles",
                    class: "font-semibold"
                  })
                ]
              )
          },
          {
            id: "all_all",
            accessorFn: row => row.total_atp_singles_wins + row.total_atp_doubles_wins + row.total_wta_singles_wins + row.total_wta_doubles_wins,
            header: ({ column }) =>
              h(
                "div",
                {
                  class: "flex items-center gap-2"
                },
                [
                  h(TableHeaderSort, {
                    column: column as Column<unknown>,
                    type: "number"
                  }),
                  h(UBadge, {
                    color: "active",
                    label: "Total",
                    class: "font-semibold"
                  })
                ]
              )
          }
        ]
      })
    ]
  })
]

const table = useTemplateRef("table")
const columnVisibility = ref({
  tour: tours.length > 1
})

const handleSelectRow = async (row: TableRow<TournamentCountryType>) => {
  await navigateTo({
    name: "country",
    params: {
      id: row.original.country.id,
      name: kebabCase(row.original.country.name)
    }
  })
}
</script>

<template>
  <client-only>
    <teleport to="#chart-container">
      <tournament-country-chart v-if="mdAndUp" />
    </teleport>
  </client-only>
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
    :data="countries"
    :columns
    :loading="['idle', 'pending'].includes(status)"
    sticky
    :faceted-options="{
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedMinMaxValues: getFacetedMinMaxValues(),
      getFacetedUniqueValues: getFacetedUniqueValues()
    }"
    v-model:column-visibility="columnVisibility"
    @select="handleSelectRow"
    :ui="{ root: '2xl:max-w-19/20', tbody: '[&>tr]:cursor-pointer' }"
  >
    <template #loading>
      <table-loading-icon />
    </template>

    <template #empty>
      <table-empty-message
        :icon="ICONS.noCountries"
        :message="`No countries represented by winners of ${tournamentName}`"
      />
    </template>
  </u-table>
</template>
