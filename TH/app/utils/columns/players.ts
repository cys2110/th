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

const wlColumnHelper = createColumnHelper<PlayerWLType>()

export const playerWLColumns: TableColumn<PlayerWLType>[] = [
  {
    accessorKey: "label",
    header: "",
    cell: ({ cell }) => {
      const label = cell.getValue<keyof typeof appConfig.ui.colors | "Total">()

      return h(UBadge, {
        label,
        color: label === "Total" ? "primary" : label,
        class: "w-full"
      })
    }
  },
  wlColumnHelper.group({
    id: "total",
    header: () =>
      h(UBadge, {
        label: "Total",
        color: "primary",
        class: "w-full"
      }),
    columns: [
      wlColumnHelper.group({
        id: "total_singles",
        header: () =>
          h(UBadge, {
            label: "Singles",
            color: "Singles",
            class: "w-full"
          }),
        columns: [
          { accessorKey: "total.singles.wl", header: "Win-Loss" },
          { accessorKey: "total.singles.titles", header: "Titles" }
        ]
      }),
      wlColumnHelper.group({
        id: "total_doubles",
        header: () =>
          h(UBadge, {
            label: "Doubles",
            color: "Doubles",
            class: "w-full"
          }),
        columns: [
          { accessorKey: "total.doubles.wl", header: "Win-Loss" },
          { accessorKey: "total.doubles.titles", header: "Titles" }
        ]
      })
    ]
  }),
  wlColumnHelper.group({
    id: "main",
    header: () =>
      h(UBadge, {
        label: "Main",
        color: "Main",
        class: "w-full"
      }),
    columns: [
      wlColumnHelper.group({
        id: "main_singles",
        header: () =>
          h(UBadge, {
            label: "Singles",
            color: "Singles",
            class: "w-full"
          }),
        columns: [
          { accessorKey: "main.singles.wl", header: "Win-Loss" },
          { accessorKey: "main.singles.titles", header: "Titles" }
        ]
      }),
      wlColumnHelper.group({
        id: "main_doubles",
        header: () =>
          h(UBadge, {
            label: "Doubles",
            color: "Doubles",
            class: "w-full"
          }),
        columns: [
          { accessorKey: "main.doubles.wl", header: "Win-Loss" },
          { accessorKey: "main.doubles.titles", header: "Titles" }
        ]
      })
    ]
  }),
  wlColumnHelper.group({
    id: "qualifying",
    header: () =>
      h(UBadge, {
        label: "Qualifying",
        color: "Qualifying",
        class: "w-full"
      }),
    columns: [
      wlColumnHelper.group({
        id: "qualifying_singles",
        header: () =>
          h(UBadge, {
            label: "Singles",
            color: "Singles",
            class: "w-full"
          }),
        columns: [{ accessorKey: "qualifying.singles", header: "" }]
      }),
      wlColumnHelper.group({
        id: "qualifying_doubles",
        header: () =>
          h(UBadge, {
            label: "Doubles",
            color: "Doubles",
            class: "w-full"
          }),
        columns: [{ accessorKey: "qualifying.doubles", header: "" }]
      })
    ]
  })
]

export const playerH2HColumns: TableColumn<PlayerH2HType>[] = [
  {
    id: "opponent",
    header: "Opponent",
    cell: ({ row }) => {
      const { opponent } = row.original

      if (opponent.country) {
        return h(PlayerLink, { player: opponent })
      } else {
        return h(
          ULink,
          {
            class: "hover-link default-link",
            target: "_blank",
            to: {
              name: "player",
              params: {
                id: opponent.id,
                name: "—"
              }
            }
          },
          () => opponent.id
        )
      }
    }
  },
  {
    id: "wl",
    meta: { class: { th: "text-right", td: "text-right" } },
    header: "Win-Loss",
    cell: ({ row }) => `${row.original.wins}-${row.original.losses}`
  }
]

export const recentEventColumns = computed<TableColumn<PlayerRecentEventType>[]>(() => {
  return [
    {
      id: "tournament",
      accessorKey: "tournament.name",
      header: "Tournament",
      cell: ({ row }) => {
        const {
          tournament: { id, name }
        } = row.original

        return h(
          ULink,
          {
            class: "hover-link default-link",
            to: {
              name: "tournament",
              params: {
                id,
                name: kebabCase(name)
              }
            }
          },
          () => name
        )
      }
    },
    {
      accessorKey: "start_date",
      header: "Dates",
      cell: ({ row }) => {
        const { start_date, end_date } = row.original

        return (lgAndDown.value ? shortDateFormat : dateTimeFormat).formatRange(new Date(start_date), new Date(end_date))
      }
    },
    {
      accessorKey: "category",
      header: "Category"
    },
    {
      id: "surface",
      accessorKey: "surface.id",
      header: "Surface"
    },
    {
      accessorKey: "round",
      header: "Round Reached",
      cell: ({ cell, row }) => {
        const { title } = row.original

        return title ? "Win" : cell.renderValue()
      }
    }
  ]
})
