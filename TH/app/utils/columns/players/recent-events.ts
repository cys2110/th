import { ULink } from "#components"
import type { TableColumn } from "@nuxt/ui"

const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const lgAndDown = breakpoints.smaller("xl")

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
