import { PlayerLink, TableClientFilterHeader, TableClientNameFilterHeader, TableClientSortHeader, UBadge } from "#components"
import type { TableColumn } from "@nuxt/ui"
import { createColumnHelper, type Column, type Table } from "@tanstack/vue-table"
import appConfig from "~/app.config"

const finalistsColumnHelper = createColumnHelper<TournamentFinalistType>()
export const tournamentFinalistsColumns = (): TableColumn<TournamentFinalistType>[] => {
  return [
    {
      accessorKey: "tour",
      header: ({ column }) =>
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Tour",
          icon: ICONS.tour
        }),
      cell: ({ cell }) => h(UBadge, { color: cell.getValue<keyof typeof appConfig.ui.colors>(), label: cell.getValue<string>() })
    },
    {
      id: "player",
      accessorFn: row => `${row.last_name}, ${row.first_name}`,
      header: ({ column }) =>
        h("div", { class: "flex items-center gap-0.5 justify-center" }, [
          h(TableClientNameFilterHeader, {
            column: column as Column<unknown>,
            label: "Player",
            icon: ICONS.player
          }),
          h(TableClientSortHeader, {
            column: column as Column<unknown>
          })
        ]),
      cell: ({ row }) =>
        h(PlayerLink, {
          player: {
            id: row.original.id,
            first_name: row.original.first_name,
            last_name: row.original.last_name,
            country: row.original.country
          }
        })
    },
    finalistsColumnHelper.group({
      header: "Singles",
      columns: [
        {
          id: "singles_wl",
          header: "Win-Loss",
          cell: ({ row }) => `${row.original.singles_wins}-${row.original.singles_losses}`
        },
        {
          id: "singles_pc",
          accessorFn: row => percentage(row.singles_wins, row.singles_wins + row.singles_losses),
          header: ({ column }) =>
            h(TableClientSortHeader, {
              column: column as Column<unknown>,
              label: "Win %"
            }),
          cell: ({ cell }) => `${Math.round(cell.getValue<number>())}%`
        }
      ]
    }),
    finalistsColumnHelper.group({
      header: "Doubles",
      columns: [
        {
          id: "doubles_wl",
          header: "Win-Loss",
          cell: ({ row }) => `${row.original.doubles_wins}-${row.original.doubles_losses}`
        },
        {
          id: "doubles_pc",
          accessorFn: row => percentage(row.doubles_wins, row.doubles_wins + row.doubles_losses),
          header: ({ column }) =>
            h(TableClientSortHeader, {
              column: column as Column<unknown>,
              label: "Win %"
            }),
          cell: ({ cell }) => `${Math.round(cell.getValue<number>())}%`
        }
      ]
    })
  ]
}
