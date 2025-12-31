/** @description Column definitions for country related tables */

import type { TableColumn } from "@nuxt/ui"
import type { Column } from "@tanstack/vue-table"
import {
  TableClientFilterHeader,
  TableClientGroupHeader,
  TableClientNameFilterHeader,
  TableClientSortHeader,
  UBadge,
  UButton,
  UIcon
} from "#components"
import appConfig from "~/app.config"

/** @constant countriesColumns - column definitions for countries page */
export const countriesColumns: TableColumn<CountryType>[] = [
  {
    accessorKey: "name",
    aggregationFn: "uniqueCount",
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Country"
        }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ]),
    cell: ({ cell, row }) => {
      if (row.getIsGrouped()) {
        const count = cell.getValue<number>()
        return `${count} ${count === 1 ? "country" : "countries"}`
      } else {
        return h("div", { class: "flex items-center gap-2 justify-start" }, [h(UIcon, { name: getFlagCode(row.original) }), cell.getValue<string>()])
      }
    }
  },
  {
    accessorKey: "continent",
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientGroupHeader, {
          column: column as Column<unknown>
        }),
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Continent"
        }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ]),
    cell: ({ cell, row, table }) => {
      const continent = cell.getValue<string>()

      if (row.getIsGrouped()) {
        return h("div", { class: "flex items-center py-1" }, [
          h(UButton, {
            variant: "ghost",
            class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
            icon: appConfig.ui.icons.chevronDoubleRight,
            onClick: () => row.toggleExpanded()
          }),
          continent
        ])
      } else if (!table.getState().grouping.length) {
        return continent
      }
    }
  }
]

const levelBadgeMapping: Record<string, keyof typeof appConfig.ui.colors> = {
  "Grand Slam": "primary",
  Masters: "success",
  Finals: "ITF",
  Olympics: "warning"
}

/** @constant countryTitlesColumns - column definitions for big titles table on country page */
export const countryTitlesColumns: TableColumn<CountryTitleType>[] = [
  {
    accessorKey: "tour",
    meta: { class: { td: "text-center" } },
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientGroupHeader, {
          column: column as Column<unknown>
        }),
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Tour"
        }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ]),
    cell: ({ cell, row, table }) => {
      const tour = cell.getValue<keyof typeof appConfig.ui.colors>()

      if (row.getIsGrouped()) {
        const groupingColumn = row.groupingColumnId

        if (groupingColumn === "tour") {
          return h("div", { class: "flex items-center py-1" }, [
            h(UButton, {
              variant: "ghost",
              class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
              icon: appConfig.ui.icons.chevronDoubleRight,
              onClick: () => row.toggleExpanded()
            }),
            h(UBadge, {
              label: tour,
              color: tour
            })
          ])
        }
      } else if (!table.getState().grouping.includes("tour")) {
        return h(UBadge, {
          label: tour,
          color: tour
        })
      }
    }
  },
  {
    id: "player",
    meta: { class: { td: "text-center" } },
    aggregationFn: "uniqueCount",
    accessorFn: row => `${row.last_name}, ${row.first_name}`,
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientGroupHeader, {
          column: column as Column<unknown>
        }),
        h(TableClientNameFilterHeader, {
          column: column as Column<unknown>,
          label: "Player"
        }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ]),
    cell: ({ cell, row, table }) => {
      if (row.getIsGrouped()) {
        const groupingColumn = row.groupingColumnId

        if (groupingColumn === "player") {
          return h("div", { class: "flex items-center py-1" }, [
            h(UButton, {
              variant: "ghost",
              class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
              icon: appConfig.ui.icons.chevronDoubleRight,
              onClick: () => row.toggleExpanded()
            }),
            `${row.original.first_name} ${row.original.last_name}`
          ])
        } else {
          const count = cell.getValue<number>()
          return `${count} ${count === 1 ? "player" : "players"}`
        }
      } else if (!table.getState().grouping.includes("player")) {
        return `${row.original.first_name} ${row.original.last_name}`
      }
    }
  },
  {
    accessorKey: "edition.type",
    meta: { class: { td: "text-center" } },
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientGroupHeader, {
          column: column as Column<unknown>
        }),
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "S/D"
        }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ]),
    cell: ({ cell, row, table }) => {
      const type = cell.getValue<keyof typeof appConfig.ui.colors>()

      if (row.getIsGrouped()) {
        const groupingColumn = row.groupingColumnId

        if (groupingColumn === "edition_type") {
          return h("div", { class: "flex items-center py-1" }, [
            h(UButton, {
              variant: "ghost",
              class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
              icon: appConfig.ui.icons.chevronDoubleRight,
              onClick: () => row.toggleExpanded()
            }),
            h(UBadge, {
              label: type,
              color: type
            })
          ])
        }
      } else if (!table.getState().grouping.includes("edition_type")) {
        return h(UBadge, {
          label: type,
          color: type
        })
      }
    }
  },
  {
    id: "category",
    meta: { class: { td: "text-center" } },
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
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientGroupHeader, {
          column: column as Column<unknown>
        }),
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Category"
        }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ]),
    cell: ({ cell, row, table }) => {
      const category = cell.getValue<keyof typeof levelBadgeMapping>()

      if (row.getIsGrouped()) {
        const groupingColumn = row.groupingColumnId

        if (groupingColumn === "edition_category") {
          return h("div", { class: "flex items-center py-1" }, [
            h(UButton, {
              variant: "ghost",
              class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
              icon: appConfig.ui.icons.chevronDoubleRight,
              onClick: () => row.toggleExpanded()
            }),
            h(UBadge, {
              label: category,
              color: levelBadgeMapping[category]
            })
          ])
        }
      } else if (!table.getState().grouping.includes("category")) {
        return h(UBadge, {
          label: category,
          color: levelBadgeMapping[category]
        })
      }
    }
  },
  {
    accessorKey: "edition.tournament.name",
    meta: { class: { td: "text-center" } },
    aggregationFn: "uniqueCount",
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientGroupHeader, {
          column: column as Column<unknown>
        }),
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Tournament"
        }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ]),
    cell: ({ cell, row, table }) => {
      if (row.getIsGrouped()) {
        const groupingColumn = row.groupingColumnId

        if (groupingColumn === "edition_tournament_name") {
          const tournament = cell.getValue<string>()
          return h("div", { class: "flex items-center py-1" }, [
            h(UButton, {
              variant: "ghost",
              class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
              icon: appConfig.ui.icons.chevronDoubleRight,
              onClick: () => row.toggleExpanded()
            }),
            tournament
          ])
        } else {
          const tournament = cell.getValue<number>()
          return `${tournament} ${tournament === 1 ? "tournament" : "tournaments"}`
        }
      } else if (!table.getState().grouping.includes("edition_tournament_name")) {
        const tournament = cell.getValue<string>()
        return tournament
      }
    }
  },
  {
    accessorKey: "edition.year",
    meta: { class: { td: "text-center" } },
    aggregationFn: "uniqueCount",
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientGroupHeader, {
          column: column as Column<unknown>
        }),
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Year"
        }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ]),
    cell: ({ cell, row, table }) => {
      const year = cell.getValue<number>()
      if (row.getIsGrouped()) {
        const groupingColumn = row.groupingColumnId

        if (groupingColumn === "edition_year") {
          return h("div", { class: "flex items-center py-1" }, [
            h(UButton, {
              variant: "ghost",
              class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
              icon: appConfig.ui.icons.chevronDoubleRight,
              onClick: () => row.toggleExpanded()
            }),
            year
          ])
        } else {
          return `${year} ${year === 1 ? "year" : "years"}`
        }
      } else if (!table.getState().grouping.includes("edition_year")) {
        return year
      }
    }
  }
]
