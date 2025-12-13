<script setup lang="ts">
import { CountriesLink, PlayersLink, UBadge, ULink } from "#components"
import type { TableColumn } from "@nuxt/ui"
import { createColumnHelper } from "@tanstack/vue-table"

const {
  params: { id, name }
} = useRoute("tournament")

const { data, status } = await useFetch("/api/tournaments/country", {
  query: { id },
  default: () => []
})

const columnHelper = createColumnHelper<TournamentCountryType>()
const columns: TableColumn<TournamentCountryType>[] = [
  {
    accessorKey: "country.name",
    header: "Country",
    cell: ({ row }) =>
      h(CountriesLink, {
        country: row.original.country,
        iconOnly: true
      })
  },
  columnHelper.group({
    header: "Individual Winners",
    columns: [
      columnHelper.group({
        id: "distinct_atp",
        header: () => h(UBadge, { color: "ATP", label: "ATP", class: "font-semibold w-full justify-center" }),
        columns: [
          {
            accessorKey: "atp_singles_wins",
            header: "Singles"
          },
          {
            accessorKey: "atp_doubles_wins",
            header: "Doubles"
          },
          {
            id: "distinct_total_atp",
            accessorFn: row => row.atp_singles_wins + row.atp_doubles_wins,
            header: "Total"
          }
        ]
      }),
      columnHelper.group({
        id: "distinct_wta",
        header: () => h(UBadge, { color: "WTA", label: "WTA", class: "font-semibold w-full justify-center" }),
        columns: [
          {
            accessorKey: "wta_singles_wins",
            header: "Singles"
          },
          {
            accessorKey: "wta_doubles_wins",
            header: "Doubles"
          },
          {
            id: "distinct_total_wta",
            accessorFn: row => row.wta_singles_wins + row.wta_doubles_wins,
            header: "Total"
          }
        ]
      }),
      columnHelper.group({
        id: "distinct_total",
        header: () => h(UBadge, { color: "primary", label: "Total", class: "font-semibold w-full justify-center" }),
        columns: [
          {
            id: "total_singles",
            accessorFn: row => row.atp_singles_wins + row.wta_singles_wins,
            header: "Singles"
          },
          {
            id: "total_doubles",
            accessorFn: row => row.atp_doubles_wins + row.wta_doubles_wins,
            header: "Doubles"
          },
          {
            id: "distinct_all",
            accessorFn: row => row.atp_singles_wins + row.atp_doubles_wins + row.wta_singles_wins + row.wta_doubles_wins,
            header: "Total"
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
        header: () => h(UBadge, { color: "ATP", label: "ATP", class: "font-semibold w-full justify-center" }),
        columns: [
          {
            accessorKey: "total_atp_singles_wins",
            header: "Singles"
          },
          {
            accessorKey: "total_atp_doubles_wins",
            header: "Doubles"
          },
          {
            id: "total_atp",
            accessorFn: row => row.total_atp_singles_wins + row.total_atp_doubles_wins,
            header: "Total"
          }
        ]
      }),
      columnHelper.group({
        id: "total_wta",
        header: () => h(UBadge, { color: "WTA", label: "WTA", class: "font-semibold w-full justify-center" }),
        columns: [
          {
            accessorKey: "total_wta_singles_wins",
            header: "Singles"
          },
          {
            accessorKey: "total_wta_doubles_wins",
            header: "Doubles"
          },
          {
            id: "total_wta",
            accessorFn: row => row.total_wta_singles_wins + row.total_wta_doubles_wins,
            header: "Total"
          }
        ]
      }),
      columnHelper.group({
        id: "all_total",
        header: () => h(UBadge, { color: "primary", label: "Total", class: "font-semibold w-full justify-center" }),
        columns: [
          {
            id: "all_singles",
            accessorFn: row => row.total_atp_singles_wins + row.total_wta_singles_wins,
            header: "Singles"
          },
          {
            id: "all_doubles",
            accessorFn: row => row.total_atp_doubles_wins + row.total_wta_doubles_wins,
            header: "Doubles"
          },
          {
            id: "all_all",
            accessorFn: row => row.total_atp_singles_wins + row.total_atp_doubles_wins + row.total_wta_singles_wins + row.total_wta_doubles_wins,
            header: "Total"
          }
        ]
      })
    ]
  })
]
</script>

<template>
  <div>
    <div class="flex justify-between items-center">
      <div class="text-accented text-lg font-semibold">
        <u-icon
          :name="ICONS.countries"
          class="align-middle size-5"
        />
        Countries by No. of Winners
      </div>

      <tournaments-country-chart />
    </div>

    <u-table
      :data
      :columns
      :loading="status === 'pending'"
      sticky
      :ui="{ root: 'max-h-150 my-5' }"
    >
      <template #loading>
        <loading-icon />
      </template>
      <template #empty>
        <empty
          message="No data available"
          class="m-2"
        />
      </template>
    </u-table>
  </div>
</template>
