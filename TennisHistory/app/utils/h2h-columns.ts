import { PlayerLink, ULink } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"

const columns: (players: H2HPlayerType[]) => TableColumn<H2HBaseType>[] = players => [
  {
    id: "rank",
    cell: ({ row }) => {
      const player = players.find(p => p.id === row.original.player)
      return player?.current_singles
    }
  },
  {
    accessorKey: "player",
    header: "",
    cell: ({ row }) => {
      const player = players.find(p => p.id === row.original.player)

      return h(PlayerLink, { player: player as PersonType })
    }
  },
  ...players.map(player => ({
    key: player.id,
    accessorKey: player.id,
    header: `${player.first_name} ${player.last_name}`,
    cell: ({ row }: { row: TableRow<H2HBaseType> }) => {
      if (row.original.player === player.id) {
        return "—"
      } else {
        const opponent = players.find(p => p.id === row.original.player)

        return h(
          ULink,
          {
            class: "hover-link default-link",
            to: {
              name: "head-to-head",
              params: {
                p1Name: kebabCase(`${player.first_name} ${player.last_name}`),
                p1Id: player.id,
                p2Name: kebabCase(`${opponent?.first_name} ${opponent?.last_name}`),
                p2Id: opponent!.id
              }
            }
          },
          () => row.original[player.id] || "0-0"
        )
      }
    }
  }))
]

export default columns
