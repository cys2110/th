import { CountriesLink, DevOnly, PersonUpdate, UBadge, ULink } from "#components"
import type { TableColumn } from "@nuxt/ui"
import appConfig from "~/app.config"

const currentYear = new Date().getFullYear()

const columns: TableColumn<BasePlayerType>[] = [
  {
    accessorKey: "tour",
    header: "Tour",
    cell: cell => {
      const tour = cell.getValue<keyof typeof TourEnum>()
      return h(UBadge, { label: tour, color: tour as keyof typeof appConfig.ui.colors })
    }
  },
  {
    id: "status",
    accessorFn: row => (row.max_year === currentYear ? "Active" : "Inactive"),
    header: "Status",
    cell: cell => {
      const status = cell.getValue<keyof typeof appConfig.ui.colors>()
      return h(UBadge, { label: status, color: status })
    }
  },
  {
    accessorKey: "country",
    header: "Country",
    cell: cell => {
      const country = cell.getValue<CountryType>()
      if (country) {
        return h(CountriesLink, { country, iconOnly: true })
      } else {
        return cell.renderValue()
      }
    }
  },
  { id: "name", accessorFn: row => (row.first_name ? `${row.first_name} ${row.last_name}` : "-"), header: "Player" },
  { accessorKey: "min_year", header: "Year of First Tournament", cell: cell => cell.renderValue() },
  { accessorKey: "max_year", header: "Year of Last Tournament", cell: cell => cell.renderValue() },
  {
    accessorKey: "coaches",
    header: "Coaches",
    cell: ({ row }) => {
      if (row.original.coaches?.length) {
        return row.original.coaches.map(coach =>
          h("div", { key: coach.id, class: "flex flex-col justify-center" }, [
            h(
              DevOnly,
              {},
              {
                default: () => h(PersonUpdate, { type: "Coach", person: coach }),
                fallback: () =>
                  h("div", {}, [
                    coach.labels!.includes("Player")
                      ? h(
                          ULink,
                          {
                            class: "hover-link default-link w-fit mx-auto"
                          },
                          () => `${coach.first_name} ${coach.last_name}`
                        )
                      : h("span", {}, `${coach.first_name} ${coach.last_name}`),
                    coach.years ? h("span", {}, ` (${coach.years})`) : null
                  ])
              }
            )
          ])
        )
      } else {
        return "—"
      }
    }
  }
]

export default columns
