import {
  CountryLink,
  PlayerLink,
  TableClientFilterHeader,
  TableClientGroupHeader,
  TableClientNameFilterHeader,
  TableClientSortHeader,
  TableRowToggle,
  UBadge,
  UIcon
} from "#components"
import type { TableColumn } from "@nuxt/ui"
import { type Column, type Row } from "@tanstack/table-core"
import appConfig from "~/app.config"

export const editionColumns: TableColumn<BaseEditionType>[] = [
  {
    accessorKey: "year",
    meta: { class: { td: "text-center" } },
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientGroupHeader, { column: column as Column<unknown> }),
        h(TableClientFilterHeader, { column: column as Column<unknown>, label: "Year", icon: ICONS.years }),
        h(TableClientSortHeader, { column: column as Column<unknown> })
      ]),
    cell: ({ cell, row, table }) => {
      const currentGrouping = table.getState().grouping
      if (row.getIsGrouped()) {
        if (row.groupingColumnId === "year") {
          return h(TableRowToggle, { row: row as Row<unknown>, isExpanded: row.getIsExpanded() }, () => cell.getValue())
        }
      } else {
        if (!currentGrouping.includes("year")) {
          return cell.renderValue()
        }
      }
    }
  },
  {
    accessorKey: "winner.tour",
    meta: { class: { td: "text-center" } },
    header: ({ column }) => h(TableClientFilterHeader, { column: column as Column<unknown>, label: "Tour", icon: ICONS.tour }),
    cell: ({ cell, row }) => {
      if (!row.getIsGrouped()) {
        const tour = cell.getValue<keyof typeof appConfig.ui.colors>()

        return h(UBadge, {
          label: tour,
          color: tour
        })
      }
    }
  },
  {
    accessorKey: "winner.type",
    meta: { class: { td: "text-center" } },
    header: ({ column }) => h(TableClientFilterHeader, { column: column as Column<unknown>, label: "S/D", icon: ICONS.people }),
    cell: ({ cell, row }) => {
      if (!row.getIsGrouped()) {
        const type = cell.getValue<keyof typeof appConfig.ui.colors>()

        return h(UBadge, {
          label: type,
          color: type
        })
      }
    }
  },
  {
    id: "winner",
    accessorFn: row => {
      const winner = row.winner as any

      if ("name" in winner) {
        return winner.name
      } else if ("points" in winner) {
        return winner.team
      } else {
        return winner.team.map((player: PersonType) => `${player.last_name}, ${player.first_name}`).join(" / ")
      }
    },
    header: ({ column }) => {
      const uniqueValues = Array.from(column.getFacetedUniqueValues().keys()).filter(Boolean).sort()

      return h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientGroupHeader, { column: column as Column<unknown> }),
        h(uniqueValues[0]?.includes(", ") ? TableClientNameFilterHeader : TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Winner(s)",
          icon: ICONS.trophy
        }),
        h(TableClientSortHeader, { column: column as Column<unknown> })
      ])
    },
    cell: ({ row, table }) => {
      const currentGrouping = table.getState().grouping
      const winner = row.original.winner as any

      if (winner) {
        if (row.getIsGrouped()) {
          if (row.groupingColumnId === "winner") {
            return h(TableRowToggle, { row: row as Row<unknown>, isExpanded: row.getIsExpanded() }, () => {
              if ("name" in winner) {
                return h(CountryLink, { country: winner })
              } else if ("points" in winner) {
                return h(UIcon, { name: winner.team === "Europe" ? ICONS.europe : ICONS.globe })
              } else {
                return h(
                  "div",
                  {},
                  winner.team.map((player: PersonType) => h(PlayerLink, { player }))
                )
              }
            })
          }
        } else {
          if (!currentGrouping.includes("winner")) {
            if ("name" in winner) {
              return h(CountryLink, { country: winner })
            } else if ("points" in winner) {
              return h(UIcon, { name: winner.team === "Europe" ? ICONS.europe : ICONS.globe })
            } else {
              return winner.team.map((player: PersonType) => h(PlayerLink, { player }))
            }
          }
        }
      }
    }
  }
]
