import { CountryLink, DevOnly, PersonUpdate, UBadge, UButton, VenuesUpdate } from "#components"
import type { TableColumn } from "@nuxt/ui"
import appConfig from "~/app.config"

const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")

const columns: TableColumn<any>[] = [
  {
    id: "tournament",
    header: "Tournament",
    cell: ({ row }) =>
      h("div", { class: "flex items-center gap-1" }, [
        h(UButton, {
          icon: row.getIsExpanded() ? appConfig.ui.icons.minus : appConfig.ui.icons.plus,
          color: "neutral",
          size: "xs",
          variant: "ghost",
          class: !row.getCanExpand() && "invisible",
          onClick: row.getToggleExpandedHandler()
        }),
        h("div", { class: "flex flex-col items-center w-full" }, [
          h("div", { class: "font-semibold" }, row.original.tournament?.name),
          h("div", { class: "text-sm text-muted" }, row.original.sponsor_name)
        ])
      ])
  },
  { accessorKey: "year", header: "Year" },
  {
    accessorKey: "tour",
    header: "Tour",
    cell: ({ row }) => {
      if (row.original.tour) {
        return h(UBadge, { label: row.original.tour, color: row.original.tour })
      }
    }
  },
  {
    accessorKey: "level",
    header: "Level",
    cell: ({ row }) => {
      if (row.original.tour) {
        return h(UBadge, { label: row.original.level, color: row.original.level })
      }
    }
  },
  { accessorKey: "category", header: "Category" },
  {
    id: "dates",
    header: "Dates",
    cell: ({ row }) => {
      if (row.original.start_date && row.original.end_date) {
        return mdAndDown.value
          ? shortDateFormat.formatRange(new Date(row.original.start_date), new Date(row.original.end_date))
          : dateTimeFormat.formatRange(new Date(row.original.start_date), new Date(row.original.end_date))
      }
    }
  },
  { id: "surface", accessorKey: "surface.id", header: "Surface" },
  {
    accessorKey: "venues",
    header: "Venues",
    cell: ({ row }) =>
      h(
        "div",
        { class: "flex flex-col items-center" },
        row.original.venues?.map((venue: VenueType) =>
          h(
            DevOnly,
            {},
            {
              default: () => h(VenuesUpdate, { venue }),
              fallback: () =>
                h("div", { class: "flex items-center gap-2" }, [
                  venue.name ? `${venue.name}, ${venue.city}` : venue.city,
                  h(CountryLink, { country: venue.country })
                ])
            }
          )
        )
      )
  },
  {
    accessorKey: "supervisors",
    header: "Supervisors",
    cell: ({ row }) =>
      h(
        "div",
        { class: "flex flex-col items-center" },
        row.original.supervisors?.map((supervisor: PersonType) =>
          h(
            DevOnly,
            {},
            {
              default: () => h(PersonUpdate, { type: "Supervisor", person: supervisor }),
              fallback: () => `${supervisor.first_name} ${supervisor.last_name}`
            }
          )
        )
      )
  },
  {
    accessorKey: "umpires",
    header: "Umpires",
    cell: ({ row }) =>
      h(
        "div",
        { class: "flex flex-col items-center" },
        row.original.umpires?.map((umpire: PersonType) =>
          h(
            DevOnly,
            {},
            {
              default: () => h(PersonUpdate, { type: "Umpire", person: umpire }),
              fallback: () => `${umpire.first_name} ${umpire.last_name}`
            }
          )
        )
      )
  }
]

export default columns
