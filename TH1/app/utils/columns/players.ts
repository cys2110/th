import { PlayerLink, UBadge, ULink } from "#components"
import type { TableColumn } from "@nuxt/ui"
import { createColumnHelper } from "@tanstack/vue-table"
import appConfig from "~/app.config"

const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const lgAndDown = breakpoints.smaller("xl")

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
