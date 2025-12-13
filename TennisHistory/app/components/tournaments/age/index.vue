<script setup lang="ts">
import { PlayersLink, UBadge, ULink } from "#components"
import type { TableColumn } from "@nuxt/ui"
import { createColumnHelper } from "@tanstack/vue-table"

const {
  params: { id, name }
} = useRoute("tournament")

const { data, status } = await useFetch("/api/tournaments/age", {
  query: { id },
  default: () => []
})

const columnHelper = createColumnHelper<TournamentAgeType>()
const columns: TableColumn<TournamentAgeType>[] = [
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
    header: "S/D",
    cell: ({ row }) =>
      h(UBadge, {
        label: row.original.type,
        color: row.original.type
      })
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
              edId: row.original.edId
            }
          }
        },
        () => row.original.year
      )
  },
  {
    id: "player",
    header: "Player",
    cell: ({ row }) =>
      h(PlayersLink, {
        player: row.original,
        class: "mx-auto"
      })
  },
  {
    accessorKey: "age",
    header: "Age",
    cell: ({ cell }) => {
      const age = cell.getValue<{ months: number; days: number }>()

      if (age) {
        const years = Math.floor(age.months / 12)
        const months = age.months % 12

        return `${years} years, ${months} months, ${age.days} days`
      } else {
        return "—"
      }
    }
  }
]
</script>

<template>
  <div>
    <div class="flex justify-between items-center">
      <div class="text-accented text-lg font-semibold">
        <u-icon
          :name="ICONS.event"
          class="align-middle size-5"
        />
        Winners by Age
      </div>

      <tournaments-age-chart
        v-if="data.length"
        :winners="data"
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
