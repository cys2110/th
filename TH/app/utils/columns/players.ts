import {
  CountryLink,
  PlayerLink,
  TableRowToggle,
  TableServerFilterHeader,
  TableServerGroupHeader,
  TableServerSearchHeader,
  TableServerSortHeader,
  UBadge,
  UChip,
  UIcon,
  ULink
} from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import { createColumnHelper } from "@tanstack/vue-table"
import appConfig from "~/app.config"

const currentYear = new Date().getFullYear()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const lgAndDown = breakpoints.smaller("xl")

export const playerColumns: TableColumn<PlayersResultsType>[] = [
  {
    accessorKey: "tour",
    meta: { class: { td: "text-center" } },
    header: () =>
      h(TableServerFilterHeader, {
        label: "Tour",
        filterKey: "tour",
        type: "stringArray",
        items: ["ATP", "WTA"],
        multiple: true,
        icon: ICONS.tour
      }),
    cell: ({ cell, row }) => {
      if (!row.original.__group) {
        const status = row.getValue<"Active" | "Inactive">("status")
        const tour = cell.getValue<"ATP" | "WTA">()

        return h(
          UChip,
          {
            color: status
          },
          () =>
            h(UBadge, {
              label: row.original.tour,
              color: row.original.tour as keyof typeof appConfig.ui.colors
            })
        )
      }
    }
  },
  {
    id: "status",
    accessorFn: row => (row.max_year === currentYear ? "Active" : "Inactive"),
    header: "Status",
    cell: ({ cell, row }) => {
      if (!row.original.__group) {
        const status = cell.getValue<"Active" | "Inactive">()

        return h(UBadge, {
          label: status,
          color: status
        })
      }
    }
  },
  {
    id: "country",
    header: () =>
      h("div", { class: "flex items-center justify-center gap-0.5" }, [
        h(TableServerGroupHeader, {
          groupingValue: "country"
        }),
        h(TableServerSearchHeader, {
          label: "Country",
          type: "Country",
          multiple: true,
          filterKey: "countries",
          icon: ICONS.globe
        }),
        h(TableServerSortHeader, {
          sortKey: "country"
        })
      ]),
    cell: ({ row, table }) => {
      if (row.original.__group) {
        if (row.original.id.startsWith("g:country:")) {
          const isExpanded = (table.getState().expanded as Record<string, boolean>)[row.id]

          return h(
            TableRowToggle,
            {
              row: row as TableRow<unknown>,
              isExpanded,
              disabled: !row.original.has_children
            },
            () => h(CountryLink, { country: row.original.group as CountryType })
          )
        }
      } else if (!row.getParentRow()?.original.id.startsWith("g:country:")) {
        return h(CountryLink, { country: row.original.country!, iconOnly: true, class: "mx-auto" })
      }
    }
  },
  {
    id: "name",
    accessorFn: row => (row.first_name ? `${row.first_name} ${row.last_name}` : undefined),
    header: () =>
      h("div", { class: "flex items-center justify-center gap-0.5" }, [
        h(TableServerSearchHeader, {
          label: "Player",
          type: "Player",
          multiple: true,
          filterKey: "players",
          icon: ICONS.player
        }),
        h(TableServerSortHeader, {
          sortKey: "name"
        })
      ])
  },
  {
    id: "first_tournament_year",
    accessorKey: "min_year",
    meta: { class: { td: "text-center" } },
    header: () =>
      h("div", { class: "flex items-center justify-center gap-0.5" }, [
        h(TableServerGroupHeader, {
          groupingValue: "min_year"
        }),
        h(TableServerFilterHeader, {
          label: "First Tournament Year",
          multiple: true,
          filterKey: "min_year",
          type: "number",
          items: ALL_YEARS,
          icon: ICONS.years
        }),
        h(TableServerSortHeader, {
          sortKey: "min_year"
        })
      ]),
    cell: ({ cell, row, table }) => {
      if (row.original.__group) {
        if (row.original.id.startsWith("g:min_year:")) {
          const isExpanded = (table.getState().expanded as Record<string, boolean>)[row.id]

          return h(
            TableRowToggle,
            {
              row: row as TableRow<unknown>,
              isExpanded,
              disabled: !row.original.has_children
            },
            () => ("year" in row.original.group ? row.original.group.year : "")
          )
        }
      } else if (!row.getParentRow()?.original.id.startsWith("g:min_year:")) {
        return cell.renderValue()
      }
    }
  },
  {
    id: "last_tournament_year",
    accessorKey: "max_year",
    meta: { class: { td: "text-center" } },
    header: () =>
      h("div", { class: "flex items-center justify-center gap-0.5" }, [
        h(TableServerGroupHeader, {
          groupingValue: "max_year"
        }),
        h(TableServerFilterHeader, {
          label: "Last Tournament Year",
          multiple: true,
          filterKey: "max_year",
          type: "number",
          items: ALL_YEARS,
          icon: ICONS.years
        }),
        h(TableServerSortHeader, {
          sortKey: "max_year"
        })
      ]),
    cell: ({ cell, row, table }) => {
      if (row.original.__group) {
        if (row.original.id.startsWith("g:max_year:")) {
          const isExpanded = (table.getState().expanded as Record<string, boolean>)[row.id]

          return h(
            TableRowToggle,
            {
              row: row as TableRow<unknown>,
              isExpanded,
              disabled: !row.original.has_children
            },
            () => ("year" in row.original.group ? row.original.group.year : "")
          )
        }
      } else if (!row.getParentRow()?.original.id.startsWith("g:max_year:")) {
        return cell.renderValue()
      }
    }
  },
  {
    id: "coaches",
    header: () =>
      h(TableServerSearchHeader, {
        label: "Coaches",
        type: "Coach",
        multiple: true,
        filterKey: "coaches",
        icon: ICONS.coach
      }),
    cell: ({ row }) => {
      if (!row.original.__group) {
        const { coaches } = row.original

        if (coaches && coaches.length) {
          return row.original.coaches?.map(coach => {
            if (coach.labels.includes("Player")) {
              return h("div", { class: "flex flex-wrap items-center gap-1" }, [
                h(
                  ULink,
                  {
                    class: "hover-link primary-link",
                    to: {
                      name: "player",
                      params: {
                        id: coach.id,
                        name: kebabCase(`${coach.first_name} ${coach.last_name}`)
                      }
                    }
                  },
                  () => `${coach.first_name} ${coach.last_name}`
                ),
                coach.years && h("span", {}, ` (${coach.years})`)
              ])
            } else {
              return h("div", {}, [
                h("span", {}, `${coach.first_name} ${coach.last_name}`),
                coach.years && h("span", { class: "ml-0.5" }, ` (${coach.years})`)
              ])
            }
          })
        } else {
          return "—"
        }
      }
    }
  }
]
