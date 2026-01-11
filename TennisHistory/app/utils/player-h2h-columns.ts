import { CountryLink, PlayerLink, ULink } from "#components"
import type { TableColumn } from "@nuxt/ui"

const columns: TableColumn<PlayerH2HType>[] = [
  {
    id: "opponent",
    meta: { class: { th: "text-left" } },
    header: "Opponent",
    cell: ({ row }) =>
      h("div", { class: "flex items-center gap-2" }, [
        row.original.opponent.country?.id &&
          h(CountryLink, {
            country: row.original.opponent.country,
            iconOnly: true,
            class: "mx-0"
          }),
        row.original.opponent.last_name ? `${row.original.opponent.first_name} ${row.original.opponent.last_name}` : row.original.opponent.id
      ])
  },
  {
    id: "wl",
    meta: { class: { th: "text-right", td: "text-right" } },
    header: "Win-Loss",
    cell: ({ row }) => `${row.original.wins}-${row.original.matches - row.original.wins}`
  }
]

export default columns
