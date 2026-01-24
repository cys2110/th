import { TableClientFilterHeader, TableClientGroupHeader, TableClientSortHeader, TableRowToggle, UBadge } from "#components"
import type { TableColumn } from "@nuxt/ui"
import { type Column, type Row } from "@tanstack/vue-table"
import appConfig from "~/app.config"

export const tournamentAwardsColumns = (): TableColumn<TournamentPmType>[] => {
  const tournamentStore = useTournamentStore()

  return [
    {
      accessorKey: "tour",
      header: ({ column }) =>
        h("div", { class: "flex items-center gap-0.5 justify-center" }, [
          h(TableClientGroupHeader, {
            column: column as Column<unknown>
          }),
          h(TableClientFilterHeader, {
            column: column as Column<unknown>,
            label: "Tour",
            icon: ICONS.tour
          })
        ]),
      cell: ({ cell, row, table }) => {
        const currentGrouping = table.getState().grouping
        const value = cell.getValue<keyof typeof appConfig.ui.colors>()

        if (row.getIsGrouped()) {
          if (row.groupingColumnId === "tour") {
            return h(
              TableRowToggle,
              {
                row: row as Row<unknown>,
                isExpanded: row.getIsExpanded()
              },
              () => h(UBadge, { color: value, label: value })
            )
          }
        } else if (!currentGrouping.includes("tour")) {
          return h(UBadge, { color: value, label: value })
        }
      }
    },
    {
      accessorKey: "type",
      header: ({ column }) =>
        h("div", { class: "flex items-center gap-0.5 justify-center" }, [
          h(TableClientGroupHeader, {
            column: column as Column<unknown>
          }),
          h(TableClientFilterHeader, {
            column: column as Column<unknown>,
            label: "S/D",
            icon: ICONS.people
          })
        ]),
      cell: ({ cell, row, table }) => {
        const currentGrouping = table.getState().grouping
        const value = cell.getValue<keyof typeof appConfig.ui.colors>()

        if (row.getIsGrouped()) {
          if (row.groupingColumnId === "type") {
            return h(
              TableRowToggle,
              {
                row: row as Row<unknown>,
                isExpanded: row.getIsExpanded()
              },
              () => h(UBadge, { color: value, label: value })
            )
          }
        } else if (!currentGrouping.includes("type")) {
          return h(UBadge, { color: value, label: value })
        }
      }
    },
    {
      accessorKey: "year",
      header: ({ column }) =>
        h("div", { class: "flex items-center gap-0.5 justify-center" }, [
          h(TableClientGroupHeader, {
            column: column as Column<unknown>
          }),
          h(TableClientFilterHeader, {
            column: column as Column<unknown>,
            label: "Year",
            icon: ICONS.years
          }),
          h(TableClientSortHeader, {
            column: column as Column<unknown>
          })
        ]),
      cell: ({ cell, row, table }) => {
        const currentGrouping = table.getState().grouping
        const value = cell.getValue<number>()

        if (row.getIsGrouped()) {
          if (row.groupingColumnId === "year") {
            return h(
              TableRowToggle,
              {
                row: row as Row<unknown>,
                isExpanded: row.getIsExpanded()
              },
              () => value
            )
          }
        } else if (!currentGrouping.includes("year")) {
          return value
        }
      }
    },
    {
      accessorKey: "round",
      header: ({ column }) =>
        h("div", { class: "flex items-center gap-0.5 justify-center" }, [
          h(TableClientGroupHeader, {
            column: column as Column<unknown>
          }),
          h(TableClientFilterHeader, {
            column: column as Column<unknown>,
            label: "Round",
            icon: ICONS.category
          }),
          h(TableClientSortHeader, {
            column: column as Column<unknown>
          })
        ]),
      cell: ({ cell, row, table }) => {
        const currentGrouping = table.getState().grouping
        const value = cell.getValue<string>()

        if (row.getIsGrouped() && row.groupingColumnId === "round") {
          return h(
            TableRowToggle,
            {
              row: row as Row<unknown>,
              isExpanded: row.getIsExpanded()
            },
            () => value
          )
        } else if (!currentGrouping.includes("round")) {
          return value
        }
      }
    },
    {
      accessorKey: "pm",
      header: ({ column }) => h(TableClientSortHeader, { column: column as Column<unknown>, label: "Prize Money" }),
      cell: ({ cell, row }) => {
        const value = cell.getValue<number>()
        if (!row.getIsGrouped() && isDefined(value)) {
          return value.toLocaleString("en-GB", { style: "currency", currency: row.original.currency ?? "USD" })
        }
      }
    },
    {
      accessorKey: "points",
      header: ({ column }) => h(TableClientSortHeader, { column: column as Column<unknown>, label: "Points" }),
      cell: ({ cell, row }) => {
        const value = cell.getValue<number>()
        if (!row.getIsGrouped() && isDefined(value)) {
          return value.toLocaleString()
        }
      }
    }
  ]
}
