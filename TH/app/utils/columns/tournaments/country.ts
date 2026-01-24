import { TableClientFilterHeader, TableClientSortHeader, UBadge, UIcon } from "#components"
import type { TableColumn } from "@nuxt/ui"
import { createColumnHelper, type Column } from "@tanstack/vue-table"
import appConfig from "~/app.config"

const countryColumnHelper = createColumnHelper<TournamentCountryType>()
export const tournamentCountryColumns = (): TableColumn<TournamentCountryType>[] => {
  const tournamentStore = useTournamentStore()

  return [
    {
      accessorKey: "name",
      header: ({ column }) => h(TableClientFilterHeader, { column: column as Column<unknown>, label: "Country", icon: ICONS.globe }),
      cell: ({ row }) => h("div", { class: "flex items-center gap-2" }, [h(UIcon, { name: getFlagCode(row.original) }), row.original.name])
    },
    ...tournamentStore.tours.map(tour =>
      countryColumnHelper.group({
        id: tour,
        header: () => {
          if (tournamentStore.tours.length > 1) {
            return h(UBadge, { color: tour as keyof typeof appConfig.ui.colors, label: tour, class: "w-full" })
          }
        },
        columns: [
          countryColumnHelper.group({
            header: "No. of Players",
            columns: [
              {
                accessorKey: `${tour}.distinct_singles_wins`,
                header: ({ column }) =>
                  h("div", { class: "flex items-center" }, [
                    h(UBadge, { color: "Singles", label: "Singles", class: "w-full" }),
                    h(TableClientSortHeader, { column: column as Column<unknown> })
                  ])
              },
              {
                accessorKey: `${tour}.distinct_doubles_wins`,
                header: ({ column }) =>
                  h("div", { class: "flex items-center" }, [
                    h(UBadge, { color: "Doubles", label: "Doubles", class: "w-full" }),
                    h(TableClientSortHeader, { column: column as Column<unknown> })
                  ])
              },
              {
                id: `${tour}_total_wins`,
                accessorFn: row => row[tour as keyof typeof row]!.distinct_singles_wins + row[tour as keyof typeof row]!.distinct_doubles_wins,
                header: ({ column }) =>
                  h("div", { class: "flex items-center" }, [
                    h(UBadge, { label: "Total", class: "w-full" }),
                    h(TableClientSortHeader, { column: column as Column<unknown> })
                  ])
              }
            ]
          }),
          countryColumnHelper.group({
            header: "Total Wins",
            columns: [
              {
                accessorKey: `${tour}.singles_wins`,
                header: ({ column }) =>
                  h("div", { class: "flex items-center" }, [
                    h(UBadge, { color: "Singles", label: "Singles", class: "w-full" }),
                    h(TableClientSortHeader, { column: column as Column<unknown> })
                  ])
              },
              {
                accessorKey: `${tour}.doubles_wins`,
                header: ({ column }) =>
                  h("div", { class: "flex items-center" }, [
                    h(UBadge, { color: "Doubles", label: "Doubles", class: "w-full" }),
                    h(TableClientSortHeader, { column: column as Column<unknown> })
                  ])
              },
              {
                id: `${tour}_total_wins`,
                accessorFn: row => row[tour as keyof typeof row]!.singles_wins + row[tour as keyof typeof row]!.doubles_wins,
                header: ({ column }) =>
                  h("div", { class: "flex items-center" }, [
                    h(UBadge, { label: "Total", class: "w-full" }),
                    h(TableClientSortHeader, { column: column as Column<unknown> })
                  ])
              }
            ]
          })
        ]
      })
    )
  ]
}
