<script setup lang="ts">
import { PlayersLink, UBadge, ULink } from "#components"
import type { TableColumn } from "@nuxt/ui"
import { createColumnHelper } from "@tanstack/vue-table"

const {
  params: { id, name }
} = useRoute("tournament")

const { data, status } = await useFetch("/api/tournaments/pm", {
  query: { id },
  default: () => []
})

const columnHelper = createColumnHelper<TournamentPmType>()
const columns: TableColumn<TournamentPmType>[] = [
  {
    accessorKey: "tour",
    header: "Tour",
    cell: ({ row }) =>
      h(UBadge, {
        label: row.original.tour,
        color: row.original.tour
      })
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) =>
      h(UBadge, {
        label: row.original.type,
        color: row.original.type
      })
  },
  {
    accessorKey: "round",
    header: "Round"
  },
  {
    accessorKey: "year",
    header: "Year",
    cell: ({ row }) =>
      h(
        ULink,
        {
          class: "hover-link default-link",
          to: {
            name: "edition",
            params: {
              id,
              name,
              year: row.original.year,
              edId: row.original.id
            }
          }
        },
        () => row.original.year
      )
  },
  {
    accessorKey: "pm",
    header: "Prize Money",
    cell: ({ row }) => {
      if (row.original.currency && row.original.pm) {
        return row.original.pm.toLocaleString("en-GB", {
          style: "currency",
          currency: row.original.currency
        })
      } else {
        return "—"
      }
    }
  },
  {
    accessorKey: "points",
    header: "Points",
    cell: ({ row }) => (row.original.points ? row.original.points.toLocaleString() : "—")
  }
]
</script>

<template>
  <div>
    <div class="flex justify-between items-center">
      <div class="text-accented text-lg font-semibold">
        <u-icon
          :name="ICONS.awards"
          class="align-middle size-5"
        />
        Historical Prize Money
      </div>

      <tournaments-pm-chart
        v-if="data.length"
        :rounds="data"
      />
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
