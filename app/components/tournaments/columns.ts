import { UBadge } from "#components"
import type { TableColumn } from "@nuxt/ui"
import appConfig from "~/app.config"

const columns: TableColumn<TournamentType>[] = [
  {
    accessorKey: "tours",
    header: "Tours",
    cell: cell => {
      const tours = cell.getValue<(keyof typeof TourEnum)[]>()

      return h(
        "div",
        {
          class: "flex justify-center items-center gap-1"
        },
        tours.map(tour =>
          h(UBadge, {
            key: tour,
            label: tour,
            color: tour as keyof typeof appConfig.ui.colors
          })
        )
      )
    }
  },
  { accessorKey: "name", header: "Tournament", cell: cell => cell.renderValue() },
  { accessorKey: "established", header: "Established", cell: cell => cell.renderValue() },
  { accessorKey: "abolished", header: "Abolished", cell: cell => cell.renderValue() }
]

export default columns
