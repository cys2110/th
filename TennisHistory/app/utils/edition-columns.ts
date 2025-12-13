import { CountriesLink, PlayersLink, UBadge, UFieldGroup } from "#components"
import type { TableColumn } from "@nuxt/ui"
import appConfig from "~/app.config"

const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")

const columns: TableColumn<BaseEditionType>[] = [
  {
    accessorKey: "year",
    header: "Year"
  },
  {
    accessorKey: "tours",
    header: "Tours",
    cell: ({ cell }) => {
      const tours = cell.getValue() as (keyof typeof appConfig.ui.colors)[]

      return h(
        "div",
        { class: "flex justify-center items-center gap-1" },
        tours.map(tour =>
          h(UBadge, {
            key: tour,
            label: tour,
            color: tour
          })
        )
      )
    }
  },
  {
    accessorKey: "sponsor_name",
    header: "Sponsor Name",
    cell: cell => cell.renderValue()
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: cell => cell.renderValue()
  },
  {
    id: "dates",
    header: "Dates",
    cell: ({ row }) => {
      const { start_date, end_date } = row.original

      if (start_date && end_date) {
        if (mdAndDown.value) {
          return shortDateFormat.formatRange(new Date(start_date), new Date(end_date))
        } else {
          return dateTimeFormat.formatRange(new Date(start_date), new Date(end_date))
        }
      } else {
        return "—"
      }
    }
  },
  {
    id: "surface",
    accessorKey: "surface.id",
    header: "Surface",
    cell: cell => cell.renderValue()
  },
  {
    accessorKey: "venues",
    header: "Venues",
    cell: ({ cell }) => {
      const venues = cell.getValue() as VenueType[]

      if (venues.length) {
        return venues.map(venue =>
          h(
            "div",
            {
              key: venue.id,
              class: "flex items-center gap-1"
            },
            [
              venue.name ? `${venue.name}, ${venue.city}` : venue.city,
              h(CountriesLink, {
                country: venue.country,
                iconOnly: true
              })
            ]
          )
        )
      } else {
        return "—"
      }
    }
  },
  {
    id: "total financial commitment",
    accessorFn: row => (row.tfc && row.currency ? row.tfc.toLocaleString("en-GB", { style: "currency", currency: row.currency }) : "—"),
    header: "TFC"
  },
  {
    accessorKey: "winners",
    header: "Winners",
    cell: ({ cell }) => {
      const winners = cell.getValue() as BaseEditionType["winners"]

      if (winners.length) {
        return winners.map(winner =>
          h(
            "div",
            {
              key: `${winner.type}-${winner.tour}`,
              class: "flex flex-col my-1.5"
            },
            [
              h(UFieldGroup, {}, () => [
                h(UBadge, {
                  label: winner.tour,
                  color: winner.tour as keyof typeof appConfig.ui.colors,
                  class: "w-full justify-center"
                }),
                h(UBadge, {
                  label: winner.type,
                  color: winner.type,
                  class: "w-full justify-center"
                })
              ]),
              h(
                "div",
                {
                  class: "flex flex-col ml-5"
                },
                winner.team.map(player =>
                  h(PlayersLink, {
                    key: player.id,
                    player
                  })
                )
              )
            ]
          )
        )
      } else {
        return "—"
      }
    }
  }
]

export default columns
