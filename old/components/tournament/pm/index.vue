<script setup lang="ts">
import { FilterTableHeader, RangeTableHeader, UBadge, UButton, ULink } from "#components"
import type { TableColumn } from "@nuxt/ui"
import {
  type Column,
  getFacetedRowModel,
  getFacetedMinMaxValues,
  getFacetedUniqueValues,
  getGroupedRowModel,
  type GroupingOptions
} from "@tanstack/vue-table"

const {
  params: { id, name }
} = useRoute("tournament")
const {
  icons,
  ui: { icons: uIcons }
} = useAppConfig()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: 1024 })
const mdAndUp = breakpoints.greaterOrEqual("md")
const tours = inject<TourType[]>("tours", [])
const tournamentName = inject<string>("tournamentName", "")

// API call
const { data: rounds, status } = await useFetch<TournamentPmType[]>("/api/tournaments/pm", {
  key: `tournament-pm-${id}`,
  query: { id },
  default: () => [],
  server: false
})

const columns: TableColumn<TournamentPmType>[] = [
  {
    id: "expand",
    cell: ({ row }: { row: any }) => {
      if (row.getIsGrouped()) {
        return h(UButton, {
          variant: "link",
          color: "neutral",
          class: "mr-2",
          size: "xs",
          icon: uIcons.chevronDoubleRight,
          ui: {
            leadingIcon: row.getIsExpanded() ? "rotate-90 transition-transform duration-200" : "transition-transform duration-200"
          },
          onClick: () => row.toggleExpanded()
        })
      }
    }
  },
  {
    accessorKey: "tour",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) =>
      h(FilterTableHeader, {
        column: column as Column<unknown>,
        label: "Tour",
        type: "alpha"
      }),
    cell: ({ row }) => {
      if (row.getIsGrouped() && row.depth === 0) {
        return h(UBadge, {
          label: row.original.tour,
          color: getTourColour(row.original.tour),
          class: "font-semibold"
        })
      }
    }
  },
  {
    accessorKey: "type",
    header: ({ column }) =>
      h(FilterTableHeader, {
        column: column as Column<unknown>,
        label: "S/D",
        type: "alpha"
      }),
    cell: ({ row }) => {
      if (row.getIsGrouped() && (tours.length > 1 ? row.depth === 1 : row.depth === 0)) {
        return h(UBadge, {
          label: row.original.type,
          color: getMatchTypeColour(row.original.type),
          class: "font-semibold"
        })
      }
    }
  },
  {
    accessorKey: "round",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) =>
      h(FilterTableHeader, {
        column: column as Column<unknown>,
        label: "Round",
        type: "alpha"
      }),
    cell: ({ row }) => {
      if (row.getIsGrouped() && (tours.length > 1 ? row.depth === 2 : row.depth === 1)) {
        return row.original.round
      }
    }
  },
  {
    accessorKey: "year",
    header: ({ column }) =>
      h(RangeTableHeader, {
        column: column as Column<unknown>,
        label: "Year"
      }),
    cell: ({ row }) => {
      if (!row.getIsGrouped()) {
        return h(
          ULink,
          {
            to: { name: "event", params: { id, name, year: row.original.year, eid: row.original.id } },
            class: "hover-link default-link font-semibold"
          },
          () => row.original.year
        )
      }
    }
  },
  {
    accessorKey: "pm",
    cell: ({ row, cell }) =>
      isDefined(cell.getValue()) && row.original.currency ?
        (cell.getValue() as number).toLocaleString("en-GB", { style: "currency", currency: row.original.currency })
      : undefined,
    aggregationFn: "max",
    sortUndefined: "last",
    header: ({ column }) =>
      h(RangeTableHeader, {
        column: column as Column<unknown>,
        label: "Prize Money"
      })
  },
  {
    accessorKey: "points",
    header: ({ column }) =>
      h(RangeTableHeader, {
        column: column as Column<unknown>,
        label: "Points"
      }),
    cell: ({ cell }) => (isDefined(cell.getValue()) ? (cell.getValue() as number).toLocaleString() : undefined),
    aggregationFn: "max",
    sortUndefined: "last"
  }
]

const columnVisibility = computed(() => ({
  tour: tours.length > 1
}))
const columnFilters = ref([])
const grouping = computed(() => (tours.length > 1 ? ["tour", "type", "round"] : ["type", "round"]))
const grouping_options = ref<GroupingOptions>({
  groupedColumnMode: false,
  getGroupedRowModel: getGroupedRowModel()
})
</script>

<template>
  <client-only>
    <teleport to="#dashboard-right">
      <tournament-pm-chart
        v-if="rounds.length && mdAndUp"
        :rounds
      />
    </teleport>
  </client-only>
  <u-table
    :data="rounds"
    :columns
    :loading="['idle', 'pending'].includes(status)"
    sticky
    :faceted-options="{
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedMinMaxValues: getFacetedMinMaxValues(),
      getFacetedUniqueValues: getFacetedUniqueValues()
    }"
    :grouping
    :grouping-options="grouping_options"
    v-model:columnFilters="columnFilters"
    v-model:column-visibility="columnVisibility"
    :ui="{ td: 'empty:p-0', root: 'max-h-150' }"
  >
    <template #loading>
      <u-icon
        :name="uIcons.loading"
        class="size-8"
      />
    </template>

    <template #empty>
      <div class="flex justify-center items-center w-full gap-2 text-error">
        <u-icon
          :name="icons.noAwards"
          class="text-base"
        />
        No prize money found for {{ tournamentName }}
      </div>
    </template>
  </u-table>
</template>
