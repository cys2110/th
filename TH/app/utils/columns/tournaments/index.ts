import type { TableColumn, TableRow } from "@nuxt/ui"
import { TableRowToggle, TableServerFilterHeader, TableServerGroupHeader, TableServerSearchHeader, TableServerSortHeader, UBadge } from "#components"

export const tournamentColumns: TableColumn<TournamentResultsType>[] = [
  {
    accessorKey: "tours",
    header: () =>
      h(TableServerFilterHeader, {
        label: "Tours",
        filterKey: "tours",
        type: "stringArray",
        items: TOUR_OPTIONS,
        multiple: true
      }),
    cell: ({ row }) => {
      if (!row.original.__group) {
        return h(
          "div",
          { class: "space-x-1" },
          row.original.tours.map((tour: any) =>
            h(UBadge, {
              key: tour,
              label: tour,
              color: tour
            })
          )
        )
      }
    }
  },
  {
    accessorKey: "name",
    header: () =>
      h("div", { class: "flex items-center gap-0.5" }, [
        h(TableServerSearchHeader, {
          label: "Tournament",
          type: "Tournament",
          filterKey: "tournaments",
          multiple: true,
          icon: ICONS.trophy
        }),
        h(TableServerSortHeader, {
          sortKey: "name"
        })
      ])
  },
  {
    accessorKey: "established",
    meta: { class: { td: "text-center" } },
    header: () =>
      h("div", { class: "flex items-center gap-0.5" }, [
        h(TableServerGroupHeader, {
          groupingValue: "established"
        }),
        h(TableServerFilterHeader, {
          label: "Established",
          icon: ICONS.years,
          filterKey: "established",
          type: "number",
          items: Array.from({ length: new Date().getFullYear() - 1877 + 1 }, (_, i) => 1877 + i)
        }),
        h(TableServerSortHeader, {
          sortKey: "established"
        })
      ]),
    cell: ({ cell, row, table }) => {
      if (row.original.__group) {
        if ((row.original.id as string).startsWith("g:established:")) {
          const isExpanded = (table.getState().expanded as Record<string, boolean>)[row.id]

          return h(
            TableRowToggle,
            {
              row: row as TableRow<unknown>,
              isExpanded,
              disabled: !row.original.has_children
            },
            () => row.original.group.year
          )
        }
      } else if (!row.getParentRow() || !(row.getParentRow()!.original.id as string).startsWith("g:established:")) {
        return cell.renderValue()
      }
    }
  },
  {
    accessorKey: "abolished",
    meta: { class: { td: "text-center" } },
    header: () =>
      h("div", { class: "flex items-center gap-0.5" }, [
        h(TableServerGroupHeader, {
          groupingValue: "abolished"
        }),
        h(TableServerFilterHeader, {
          label: "Abolished",
          icon: ICONS.years,
          filterKey: "abolished",
          type: "number",
          items: Array.from({ length: new Date().getFullYear() - 1877 + 1 }, (_, i) => 1877 + i)
        }),
        h(TableServerSortHeader, {
          sortKey: "abolished"
        })
      ]),
    cell: ({ cell, row, table }) => {
      if (row.original.__group) {
        if ((row.original.id as string).startsWith("g:abolished:")) {
          const isExpanded = (table.getState().expanded as Record<string, boolean>)[row.id]

          return h(
            TableRowToggle,
            {
              row: row as TableRow<unknown>,
              isExpanded,
              disabled: !row.original.has_children
            },
            () => row.original.group.year
          )
        }
      } else if (!row.getParentRow() || !(row.getParentRow()!.original.id as string).startsWith("g:abolished:")) {
        return cell.renderValue()
      }
    }
  }
]
