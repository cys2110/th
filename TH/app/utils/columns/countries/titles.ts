import appConfig from "~/app.config"
import type { TableColumn } from "@nuxt/ui"
import type { Column, Row } from "@tanstack/vue-table"
import { CountryLink, TableClientFilterHeader, TableClientGroupHeader, TableClientSortHeader, TableRowToggle, UBadge, ULink } from "#components"

const levelBadgeMapping: Record<string, keyof typeof appConfig.ui.colors> = {
  "Grand Slam": "primary",
  Masters: "success",
  Finals: "ITF",
  Olympics: "warning"
}

export const countryTitlesColumns: TableColumn<CountryTitleType>[] = [
  {
    accessorKey: "tour",
    meta: { class: { td: "text-center" } },
    header: ({ column }) =>
      h("div", { class: "flex justify-center items-center gap-0.5" }, [
        h(TableClientGroupHeader, {
          column: column as Column<unknown>
        }),
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Tour",
          icon: ICONS.tour
        }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ]),
    cell: ({ cell, row, table }) => {
      const currentGrouping = table.getState().grouping
      const tour = cell.getValue<keyof typeof appConfig.ui.colors>()

      if (row.getIsGrouped()) {
        if (row.groupingColumnId === "tour") {
          return h(
            TableRowToggle,
            {
              row: row as Row<unknown>
            },
            () =>
              h(UBadge, {
                label: tour,
                color: tour
              })
          )
        }
      } else if (!currentGrouping.includes("tour")) {
        return h(UBadge, {
          label: tour,
          color: tour
        })
      }
    }
  },
  {
    accessorKey: "country.name",
    meta: { class: { td: "text-center" } },
    header: "Country",
    cell: ({ row, table }) => {
      const currentGrouping = table.getState().grouping
      const { country } = row.original

      if (row.getIsGrouped()) {
        if (row.groupingColumnId === "player") {
          return h(CountryLink, {
            country,
            iconOnly: true
          })
        }
      } else if (!currentGrouping.includes("player")) {
        return h(CountryLink, {
          country,
          iconOnly: true
        })
      }
    }
  },
  {
    id: "player",
    accessorFn: row => `${row.last_name}, ${row.first_name}`,
    aggregationFn: "uniqueCount",
    meta: { class: { td: "text-center" } },
    header: ({ column }) =>
      h("div", { class: "flex justify-center items-center gap-0.5" }, [
        h(TableClientGroupHeader, {
          column: column as Column<unknown>
        }),
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Player",
          icon: ICONS.player
        }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ]),
    cell: ({ cell, row, table }) => {
      const currentGrouping = table.getState().grouping
      const { first_name, last_name } = row.original

      if (row.getIsGrouped()) {
        if (row.groupingColumnId === "player") {
          return h(
            TableRowToggle,
            {
              row: row as Row<unknown>
            },
            () => `${first_name} ${last_name}`
          )
        } else if (cell.getIsAggregated()) {
          const count = cell.getValue<number>()
          return `${count} player${count === 1 ? "" : "s"}`
        }
      } else if (!currentGrouping.includes("player")) {
        return `${first_name} ${last_name}`
      }
    }
  },
  {
    accessorKey: "edition.type",
    meta: { class: { td: "text-center" } },
    header: ({ column }) =>
      h("div", { class: "flex justify-center items-center gap-0.5" }, [
        h(TableClientGroupHeader, {
          column: column as Column<unknown>
        }),
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "S/D",
          icon: ICONS.people
        }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ]),
    cell: ({ cell, row, table }) => {
      const currentGrouping = table.getState().grouping
      const type = cell.getValue<keyof typeof appConfig.ui.colors>()

      if (row.getIsGrouped()) {
        if (row.groupingColumnId === "edition_type") {
          return h(
            TableRowToggle,
            {
              row: row as Row<unknown>
            },
            () =>
              h(UBadge, {
                label: type,
                color: type
              })
          )
        }
      } else if (!currentGrouping.includes("edition_type")) {
        return h(UBadge, {
          label: type,
          color: type
        })
      }
    }
  },
  {
    id: "category",
    accessorFn: row => {
      switch (row.edition.category) {
        case "Olympics":
        case "Grand Slam":
        case "Finals":
          return row.edition.category
        default:
          return "Masters"
      }
    },
    meta: { class: { td: "text-center" } },
    header: ({ column }) =>
      h("div", { class: "flex justify-center items-center gap-0.5" }, [
        h(TableClientGroupHeader, {
          column: column as Column<unknown>
        }),
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Category",
          icon: ICONS.category
        }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ]),
    cell: ({ cell, row, table }) => {
      const currentGrouping = table.getState().grouping
      const category = cell.getValue<keyof typeof levelBadgeMapping>()

      if (row.getIsGrouped()) {
        if (row.groupingColumnId === "edition_category") {
          return h(
            TableRowToggle,
            {
              row: row as Row<unknown>
            },
            () =>
              h(UBadge, {
                label: category,
                color: levelBadgeMapping[category]
              })
          )
        }
      } else if (!currentGrouping.includes("edition_category")) {
        return h(UBadge, {
          label: category,
          color: levelBadgeMapping[category]
        })
      }
    }
  },
  {
    accessorKey: "edition.tournament.name",
    aggregationFn: "uniqueCount",
    meta: { class: { td: "text-center" } },
    header: ({ column }) =>
      h("div", { class: "flex justify-center items-center gap-0.5" }, [
        h(TableClientGroupHeader, {
          column: column as Column<unknown>
        }),
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Tournament",
          icon: ICONS.trophy
        }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ]),
    cell: ({ cell, row, table }) => {
      const currentGrouping = table.getState().grouping
      const { id, name } = row.original.edition.tournament

      if (row.getIsGrouped()) {
        if (row.groupingColumnId === "edition_tournament_name") {
          return h(
            TableRowToggle,
            {
              row: row as Row<unknown>
            },
            () =>
              h(
                ULink,
                {
                  class: "hover-link default-link",
                  to: {
                    name: "tournament",
                    params: {
                      id,
                      name: kebabCase(name)
                    }
                  }
                },
                () => name
              )
          )
        } else if (cell.getIsAggregated()) {
          const count = cell.getValue<number>()
          return `${count} tournament${count === 1 ? "" : "s"}`
        }
      } else if (!currentGrouping.includes("edition_tournament_name")) {
        return h(
          ULink,
          {
            class: "hover-link default-link",
            to: {
              name: "tournament",
              params: {
                id,
                name: kebabCase(name)
              }
            }
          },
          () => name
        )
      }
    }
  },
  {
    accessorKey: "edition.year",
    aggregationFn: "uniqueCount",
    meta: { class: { td: "text-center" } },
    header: ({ column }) =>
      h("div", { class: "flex justify-center items-center gap-0.5" }, [
        h(TableClientGroupHeader, {
          column: column as Column<unknown>
        }),
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Year",
          icon: ICONS.years
        }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ]),
    cell: ({ cell, row, table }) => {
      const currentGrouping = table.getState().grouping
      const {
        id: edId,
        year,
        tournament: { id, name }
      } = row.original.edition

      if (row.getIsGrouped()) {
        if (row.groupingColumnId === "edition_year") {
          return h(
            TableRowToggle,
            {
              row: row as Row<unknown>
            },
            () =>
              h(
                ULink,
                {
                  class: "hover-link default-link",
                  to: {
                    name: "edition",
                    params: {
                      id,
                      name: kebabCase(name),
                      year,
                      edId
                    }
                  }
                },
                () => year
              )
          )
        } else if (cell.getIsAggregated()) {
          const count = cell.getValue<number>()
          return `${count} year${count === 1 ? "" : "s"}`
        }
      } else if (!currentGrouping.includes("edition_tournament_name")) {
        return h(
          ULink,
          {
            class: "hover-link default-link",
            to: {
              name: "edition",
              params: {
                id,
                name: kebabCase(name),
                year,
                edId
              }
            }
          },
          () => year
        )
      }
    }
  }
]
