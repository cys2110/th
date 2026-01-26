import { PlayerLink, ULink } from "#components"
import type { TableColumn } from "@nuxt/ui"

export const playerH2HColumns: TableColumn<PlayerH2HType>[] = [
  {
    id: "opponent",
    header: "Opponent",
    cell: ({ row }) => {
      const { opponent } = row.original

      if (opponent.country) {
        return h(PlayerLink, { player: opponent as PersonType })
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
