import { PlayersLink, ULink } from "#components"
import type { TableColumn } from "@nuxt/ui"

const columns: TableColumn<PlayerH2HType>[] = [
  {
    id: "opponent",
    meta: { class: { th: "text-left" } },
    header: "Opponent",
    cell: ({ row }) => {
      if (row.original.opponent.last_name) {
        return h(PlayersLink, {
          player: row.original.opponent
        })
      } else {
        return h(
          ULink,
          {
            class: "hover-link default-link",
            to: {
              name: "player",
              params: { id: row.original.opponent.id, name: "—" }
            },
            target: "_blank"
          },
          () => row.original.opponent.id
        )
      }
    }
  },
  {
    id: "wl",
    meta: { class: { th: "text-right", td: "text-right" } },
    header: "Win-Loss",
    cell: ({ row }) => `${row.original.wins}-${row.original.matches - row.original.wins}`
  }
]

export default columns
