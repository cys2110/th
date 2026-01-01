/** Column definitions for player related tables */

import {
  CountriesLink,
  PlayersLink,
  TableServerFilterHeader,
  TableServerFilterSearchHeader,
  TableServerGroupHeader,
  TableServerSortHeader,
  UBadge,
  UButton,
  UChip,
  ULink,
  UProgress
} from "#components"
import type { TableColumn } from "@nuxt/ui"
import { createColumnHelper } from "@tanstack/vue-table"
import appConfig from "~/app.config"

const currentYear = new Date().getFullYear()

/**
 * @function playerColumns
 * @param {Ref<string[] | null>} tours - reactive reference to selected tours for filtering
 * @param {Ref<string[] | null>} grouping - reactive reference to current grouping state
 * @param {Ref<OptionType[] | null>} players - reactive reference to selected players for filtering
 * @param {Ref<OptionType[] | null>} countries - reactive reference to selected countries for filtering
 * @param {Ref<OptionType[] | null>} coaches - reactive reference to selected coaches for filtering
 * @param {Ref<SortFieldType[]>} sortField - reactive reference to current sorting state
 * @returns {TableColumn<PlayersResultsType>[]} Array of table column definitions for players table
 * */

export const playerColumns = (
  grouping: Ref<string[] | null>,
  tours: Ref<string[] | null>,
  players: Ref<OptionType[] | null>,
  countries: Ref<OptionType[] | null>,
  coaches: Ref<OptionType[] | null>,
  sortField: Ref<SortFieldType[]>
): TableColumn<PlayersResultsType>[] => [
  {
    accessorKey: "tour",
    meta: { class: { td: "text-center" } },
    header: () =>
      h(TableServerFilterHeader, {
        label: "Tour",
        options: ["ATP", "WTA"],
        multiple: true,
        modelValue: tours.value ?? [],
        "onUpdate:modelValue": (val: string[] | OptionType[] | undefined) => {
          tours.value = val as string[]
        }
      }),
    cell: ({ cell, row }) => {
      const tour = cell.getValue<keyof typeof appConfig.ui.colors>()

      if (!row.original.__group) {
        const status = row.getValue<string>("status")
        return h(UChip, { color: status === "Active" ? "success" : "error" }, () => h(UBadge, { label: tour, color: tour }))
      }
    }
  },
  {
    id: "status",
    accessorFn: row => (row.max_year === currentYear ? "Active" : "Inactive"),
    meta: { class: { th: "text-center", td: "text-center" } },
    header: "Status",
    cell: ({ cell, row }) => {
      if (!row.original.__group) {
        const status = cell.getValue<keyof typeof appConfig.ui.colors>()
        return h(UBadge, { label: status, color: status === "Active" ? "success" : "error" })
      }
    }
  },
  {
    id: "country",
    enableGrouping: true,
    header: () =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableServerGroupHeader, {
          groupingValue: "country",
          modelValue: grouping.value ?? [],
          "onUpdate:modelValue": (val: string[] | undefined) => (grouping.value = val as string[])
        }),
        h(TableServerFilterSearchHeader, {
          label: "Country",
          type: "Country",
          multiple: true,
          modelValue: countries.value ?? [],
          "onUpdate:modelValue": (val: OptionType | OptionType[] | null | undefined) => {
            countries.value = val as OptionType[]
          }
        }),
        h(TableServerSortHeader, {
          sortKey: "country",
          modelValue: sortField.value,
          "onUpdate:modelValue": (val: SortFieldType[] | undefined) => {
            sortField.value = val as SortFieldType[]
          }
        })
      ]),
    cell: ({ row, table }) => {
      if (row.original.__group && row.original.name) {
        const isExpanded = (table.getState().expanded as Record<string, boolean>)[row.id]

        return h("div", { class: "flex items-center py-1" }, [
          h(UButton, {
            variant: "ghost",
            class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", isExpanded && "rotate-90"],
            icon: appConfig.ui.icons.chevronDoubleRight,
            disabled: !row.original.has_children,
            onClick: () => row.toggleExpanded()
          }),
          h(CountriesLink, {
            country: {
              id: row.original.group_key.key as string,
              name: row.original.name,
              alpha2: row.original.alpha2,
              continent: ""
            }
          })
        ])
      } else if (!row.original.__group && !grouping.value?.includes("country")) {
        const { country } = row.original

        return h(CountriesLink, { country: country as CountryType, iconOnly: true, class: "mx-auto" })
      }
    }
  },
  {
    id: "name",
    accessorFn: row => `${row.first_name} ${row.last_name}`,
    header: () =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableServerFilterSearchHeader, {
          label: "Player",
          type: "Player",
          multiple: true,
          modelValue: players.value ?? [],
          "onUpdate:modelValue": (val: OptionType | OptionType[] | null | undefined) => {
            players.value = val as OptionType[]
          }
        }),
        h(TableServerSortHeader, {
          sortKey: "name",
          modelValue: sortField.value,
          "onUpdate:modelValue": (val: SortFieldType[] | undefined) => {
            sortField.value = val as SortFieldType[]
          }
        })
      ]),
    cell: ({ cell, row }) => {
      if (row.original.__group) {
        const { count } = row.original
        return `${count} player${count !== 1 ? "s" : ""}`
      } else {
        return cell.getValue<string>()
      }
    }
  },
  {
    id: "first tournament year",
    accessorKey: "min_year",
    enableGrouping: true,
    meta: { class: { td: "text-center" } },
    header: () => {
      return h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableServerGroupHeader, {
          groupingValue: "min_year",
          label: "First Tournament Year",
          modelValue: grouping.value ?? [],
          "onUpdate:modelValue": (val: string[] | undefined) => (grouping.value = val as string[])
        }),
        h(TableServerSortHeader, {
          sortKey: "name",
          modelValue: sortField.value,
          "onUpdate:modelValue": (val: SortFieldType[] | undefined) => {
            sortField.value = val as SortFieldType[]
          }
        })
      ])
    },
    cell: ({ cell, row, table }) => {
      if (row.original.__group && row.original.min_year) {
        const isExpanded = (table.getState().expanded as Record<string, boolean>)[row.id]

        return h("div", { class: "flex items-center py-1" }, [
          h(UButton, {
            variant: "ghost",
            class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", isExpanded && "rotate-90"],
            icon: appConfig.ui.icons.chevronDoubleRight,
            disabled: !row.original.has_children,
            onClick: () => row.toggleExpanded()
          }),
          row.original.group_key.key
        ])
      } else if (!row.original.__group && !grouping.value?.includes("min_year")) {
        return cell.getValue<number>()
      }
    }
  },
  {
    id: "last tournament year",
    accessorKey: "max_year",
    enableGrouping: true,
    meta: { class: { td: "text-center" } },
    header: () =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableServerGroupHeader, {
          groupingValue: "max_year",
          label: "Last Tournament Year",
          modelValue: grouping.value ?? [],
          "onUpdate:modelValue": (val: string[] | undefined) => (grouping.value = val as string[])
        }),
        h(TableServerSortHeader, {
          sortKey: "name",
          modelValue: sortField.value,
          "onUpdate:modelValue": (val: SortFieldType[] | undefined) => {
            sortField.value = val as SortFieldType[]
          }
        })
      ]),
    cell: ({ cell, row, table }) => {
      if (row.original.__group && row.original.max_year) {
        const isExpanded = (table.getState().expanded as Record<string, boolean>)[row.id]

        return h("div", { class: "flex items-center py-1" }, [
          h(UButton, {
            variant: "ghost",
            class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", isExpanded && "rotate-90"],
            icon: appConfig.ui.icons.chevronDoubleRight,
            disabled: !row.original.has_children,
            onClick: () => row.toggleExpanded()
          }),
          row.original.group_key.key
        ])
      } else if (!row.original.__group && !grouping.value?.includes("max_year")) {
        return cell.getValue<number>()
      }
    }
  },
  {
    id: "coaches",
    header: () =>
      h(TableServerFilterSearchHeader, {
        label: "Coaches",
        type: "Coach",
        multiple: true,
        modelValue: coaches.value ?? [],
        "onUpdate:modelValue": (val: OptionType | OptionType[] | null | undefined) => {
          coaches.value = val as OptionType[]
        }
      }),
    cell: ({ row }) => {
      if (!row.original.__group) {
        return h(
          "div",
          {},
          row.original.coaches?.map(coach => {
            if (coach.labels.includes("Player")) {
              return h(
                "div",
                {
                  class: "flex flex-wrap items-center gap-1"
                },
                [
                  h(
                    ULink,
                    {
                      class: "hover-link primary-link",
                      to: {
                        name: "player",
                        params: {
                          id: coach.id,
                          name: kebabCase(`${coach.first_name} ${coach.last_name}`)
                        }
                      }
                    },
                    () => `${coach.first_name} ${coach.last_name}`
                  ),
                  coach.years && h("span", {}, ` (${coach.years})`)
                ]
              )
            } else {
              return h("div", {}, [
                h("span", {}, `${coach.first_name} ${coach.last_name}`),
                coach.years && h("span", { class: "ml-0.5" }, ` (${coach.years})`)
              ])
            }
          })
        )
      }
    }
  }
]

const wlColumnHelper = createColumnHelper<WLType>()

/** @constant playerWLColumns - Column definitions for player's WL table */
export const playerWLColumns: TableColumn<WLType>[] = [
  {
    accessorKey: "label",
    header: "",
    cell: ({ cell }) => {
      const label = cell.getValue<keyof typeof appConfig.ui.colors | "Total">()

      return h(UBadge, {
        label,
        color: label === "Total" ? "primary" : label,
        class: "w-full"
      })
    }
  },
  wlColumnHelper.group({
    id: "total",
    header: () =>
      h(UBadge, {
        label: "Total",
        color: "primary",
        class: "w-full"
      }),
    columns: [
      wlColumnHelper.group({
        id: "total_singles",
        header: () =>
          h(UBadge, {
            label: "Singles",
            color: "Singles",
            class: "w-full"
          }),
        columns: [
          { accessorKey: "total.singles.wl", header: "Win-Loss" },
          { accessorKey: "total.singles.titles", header: "Titles" }
        ]
      }),
      wlColumnHelper.group({
        id: "total_doubles",
        header: () =>
          h(UBadge, {
            label: "Doubles",
            color: "Doubles",
            class: "w-full"
          }),
        columns: [
          { accessorKey: "total.doubles.wl", header: "Win-Loss" },
          { accessorKey: "total.doubles.titles", header: "Titles" }
        ]
      })
    ]
  }),
  wlColumnHelper.group({
    id: "main",
    header: () =>
      h(UBadge, {
        label: "Main",
        color: "Main",
        class: "w-full"
      }),
    columns: [
      wlColumnHelper.group({
        id: "main_singles",
        header: () =>
          h(UBadge, {
            label: "Singles",
            color: "Singles",
            class: "w-full"
          }),
        columns: [
          { accessorKey: "main.singles.wl", header: "Win-Loss" },
          { accessorKey: "main.singles.titles", header: "Titles" }
        ]
      }),
      wlColumnHelper.group({
        id: "main_doubles",
        header: () =>
          h(UBadge, {
            label: "Doubles",
            color: "Doubles",
            class: "w-full"
          }),
        columns: [
          { accessorKey: "main.doubles.wl", header: "Win-Loss" },
          { accessorKey: "main.doubles.titles", header: "Titles" }
        ]
      })
    ]
  }),
  wlColumnHelper.group({
    id: "qualifying",
    header: () =>
      h(UBadge, {
        label: "Qualifying",
        color: "Qualifying",
        class: "w-full"
      }),
    columns: [
      wlColumnHelper.group({
        id: "qualifying_singles",
        header: () =>
          h(UBadge, {
            label: "Singles",
            color: "Singles",
            class: "w-full"
          }),
        columns: [{ accessorKey: "qualifying.singles", header: "" }]
      }),
      wlColumnHelper.group({
        id: "qualifying_doubles",
        header: () =>
          h(UBadge, {
            label: "Doubles",
            color: "Doubles",
            class: "w-full"
          }),
        columns: [{ accessorKey: "qualifying.doubles", header: "" }]
      })
    ]
  })
]

/** @constant playerH2HColumns - Column definitions for player's H2H table */
export const playerH2HColumns: TableColumn<PlayerH2HType>[] = [
  {
    id: "opponent",
    meta: { class: { th: "text-left" } },
    header: "Opponent",
    cell: ({ row }) => {
      if (row.original.opponent.country) {
        return h(PlayersLink, {
          player: row.original.opponent
        })
      } else {
        return h(
          ULink,
          {
            class: "hover-link default-link",
            target: "_blank",
            to: {
              name: "player",
              params: {
                id: row.original.opponent.id,
                name: "—"
              }
            }
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
    cell: ({ row }) => `${row.original.wins}-${row.original.losses}`
  }
]

/** @constant recentEventColumns - Column definitions for player's recent events table */
export const recentEventColumns: TableColumn<PlayerRecentEventType>[] = [
  {
    accessorKey: "tournament.name",
    header: "Tournament",
    cell: ({ row }) => {
      const { tournament } = row.original

      return h(
        ULink,
        {
          class: "hover-link default-link",
          to: { name: "tournament", params: { id: tournament.id, name: kebabCase(tournament.name) } }
        },
        () => tournament.name
      )
    }
  },
  {
    accessorKey: "start_date",
    header: "Dates",
    cell: ({ row }) => {
      const { start_date, end_date } = row.original
      return dateTimeFormat.formatRange(new Date(start_date), new Date(end_date))
    }
  },
  {
    accessorKey: "category",
    header: "Category"
  },
  {
    accessorKey: "surface.id",
    header: "Surface"
  },
  {
    accessorKey: "round",
    header: "Round Reached",
    cell: ({ cell, row }) => {
      const { title } = row.original
      const round = cell.getValue<string>()

      return title ? `Win` : round
    }
  }
]

/**
 * @constant wlIndexColumns - Column definitions for player's WL Index table
 */
export const wlIndexColumns: TableColumn<WLIndexType>[] = [
  {
    accessorKey: "category",
    meta: { class: { th: "text-center" } },
    header: "Category",
    cell: ({ cell, row }) => {
      if (row.getIsGrouped()) {
        return h("div", { class: "flex items-center" }, [
          h(UButton, {
            variant: "ghost",
            class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
            icon: appConfig.ui.icons.chevronDoubleRight,
            onClick: () => row.toggleExpanded()
          }),
          cell.getValue<string>()
        ])
      }
    }
  },
  { accessorKey: "stat", header: "Stat" },
  { id: "wl", accessorFn: row => `${row.wins}-${row.losses}`, meta: { class: { th: "text-center", td: "text-center" } }, header: "Win-Loss" },
  {
    accessorKey: "value",
    aggregationFn: "mean",
    meta: { class: { th: "text-center", td: "text-center" } },
    header: "Index",
    cell: ({ cell, row, table }) => {
      let value = 0

      if (row.getIsGrouped()) {
        if (row.getValue("category") === "Match record") {
          value = table.getRow("0").getValue("value")
        } else {
          value = cell.getValue<number>()
        }
      } else {
        value = cell.getValue<number>()
      }

      return h(
        UProgress,
        {
          modelValue: value,
          max: 1,
          ui: {
            root: "min-w-60 md:min-w-sm",
            base: "bg-Inactive-300 dark:bg-Inactive-800",
            indicator: "bg-Inactive-600 dark:bg-Inactive-500"
          }
        },
        { status: () => value.toFixed(3) }
      )
    }
  },
  {
    accessorKey: "titles",
    meta: { class: { th: "text-center", td: "text-center" } },
    header: "Titles",
    cell: ({ cell, row, table }) => {
      const categoryValue: string = row.getValue("category")
      if (row.getIsGrouped() && categoryValue === "Match record") {
        const value = table.getRow("0").getValue("titles")

        return `${value} title${value !== 1 ? "s" : ""}`
      } else if (!row.getIsGrouped()) {
        const value = cell.getValue<number>()
        return value
      }
    }
  }
]

/**
 * @function playerRecordColumns
 * @returns {TableColumn<RecordType>[]} Array of table column definitions for player's record table
 */
const recordColumnHelper = createColumnHelper<RecordType>()
export const playerRecordColumns = (tour: "ATP" | "WTA"): TableColumn<RecordType>[] => [
  { accessorKey: "year", header: "Year" },
  recordColumnHelper.group({
    id: "australian-open",
    header: () =>
      h(
        ULink,
        {
          class: "hover-link default-link",
          to: { name: "tournament", params: { id: "580", name: "australian-open" } }
        },
        () => "Australian Open"
      ),
    columns: [
      {
        accessorKey: "580.singles",
        header: () =>
          h(UBadge, {
            color: "Singles",
            label: "Singles",
            class: "w-full"
          }),
        cell: ({ row, cell }) => {
          if (cell.getValue()) {
            return h(
              ULink,
              {
                class:
                  "hover-link " +
                  (cell.getValue() === "Win"
                    ? "uppercase success-link font-semibold"
                    : cell.getValue() === "Final"
                    ? "primary-link"
                    : "default-link"),
                to: {
                  name: "edition",
                  params: {
                    id: "580",
                    name: "australian-open",
                    edId: `580${row.original.year}-${tour}`,
                    year: row.original.year
                  }
                }
              },
              () => cell.getValue() as string
            )
          } else {
            return cell.renderValue()
          }
        }
      },
      {
        accessorKey: "580.doubles",
        header: () =>
          h(UBadge, {
            color: "Doubles",
            label: "Doubles",
            class: "w-full"
          }),
        cell: ({ row, cell }) => {
          if (cell.getValue()) {
            return h(
              ULink,
              {
                class:
                  "hover-link " +
                  (cell.getValue() === "Win"
                    ? "uppercase success-link font-semibold"
                    : cell.getValue() === "Final"
                    ? "primary-link"
                    : "default-link"),
                to: {
                  name: "edition",
                  params: {
                    id: "580",
                    name: "australian-open",
                    edId: `580${row.original.year}-${tour}`,
                    year: row.original.year
                  }
                }
              },
              () => cell.getValue() as string
            )
          } else {
            return cell.renderValue()
          }
        }
      }
    ]
  }),
  recordColumnHelper.group({
    id: "french-open",
    header: () =>
      h(
        ULink,
        {
          class: "hover-link default-link",
          to: { name: "tournament", params: { id: "520", name: "french-open" } }
        },
        () => "French Open"
      ),
    columns: [
      {
        accessorKey: "520.singles",
        header: () =>
          h(UBadge, {
            color: "Singles",
            label: "Singles",
            class: "w-full"
          }),
        cell: ({ row, cell }) => {
          if (cell.getValue()) {
            return h(
              ULink,
              {
                class:
                  "hover-link " +
                  (cell.getValue() === "Win"
                    ? "uppercase success-link font-semibold"
                    : cell.getValue() === "Final"
                    ? "primary-link"
                    : "default-link"),
                to: {
                  name: "edition",
                  params: {
                    id: "520",
                    name: "french-open",
                    edId: `520${row.original.year}-${tour}`,
                    year: row.original.year
                  }
                }
              },
              () => cell.getValue() as string
            )
          } else {
            return cell.renderValue()
          }
        }
      },
      {
        accessorKey: "520.doubles",
        header: () =>
          h(UBadge, {
            color: "Doubles",
            label: "Doubles",
            class: "w-full"
          }),
        cell: ({ row, cell }) => {
          if (cell.getValue()) {
            return h(
              ULink,
              {
                class:
                  "hover-link " +
                  (cell.getValue() === "Win"
                    ? "uppercase success-link font-semibold"
                    : cell.getValue() === "Final"
                    ? "primary-link"
                    : "default-link"),
                to: {
                  name: "edition",
                  params: {
                    id: "520",
                    name: "french-open",
                    edId: `520${row.original.year}-${tour}`,
                    year: row.original.year
                  }
                }
              },
              () => cell.getValue() as string
            )
          } else {
            return cell.renderValue()
          }
        }
      }
    ]
  }),
  recordColumnHelper.group({
    id: "wimbledon",
    header: () =>
      h(
        ULink,
        {
          class: "hover-link default-link",
          to: { name: "tournament", params: { id: "540", name: "wimbledon" } }
        },
        () => "Wimbledon"
      ),
    columns: [
      {
        accessorKey: "540.singles",
        header: () =>
          h(UBadge, {
            color: "Singles",
            label: "Singles",
            class: "w-full"
          }),
        cell: ({ row, cell }) => {
          if (cell.getValue()) {
            return h(
              ULink,
              {
                class:
                  "hover-link " +
                  (cell.getValue() === "Win"
                    ? "uppercase success-link font-semibold"
                    : cell.getValue() === "Final"
                    ? "primary-link"
                    : "default-link"),
                to: {
                  name: "edition",
                  params: {
                    id: "540",
                    name: "wimbledon",
                    edId: `540${row.original.year}-${tour}`,
                    year: row.original.year
                  }
                }
              },
              () => cell.getValue() as string
            )
          } else {
            return cell.renderValue()
          }
        }
      },
      {
        accessorKey: "540.doubles",
        header: () =>
          h(UBadge, {
            color: "Doubles",
            label: "Doubles",
            class: "w-full"
          }),
        cell: ({ row, cell }) => {
          if (cell.getValue()) {
            return h(
              ULink,
              {
                class:
                  "hover-link " +
                  (cell.getValue() === "Win"
                    ? "uppercase success-link font-semibold"
                    : cell.getValue() === "Final"
                    ? "primary-link"
                    : "default-link"),
                to: {
                  name: "edition",
                  params: {
                    id: "540",
                    name: "wimbledon",
                    edId: `540${row.original.year}-${tour}`,
                    year: row.original.year
                  }
                }
              },
              () => cell.getValue() as string
            )
          } else {
            return cell.renderValue()
          }
        }
      }
    ]
  }),
  recordColumnHelper.group({
    id: "us-open",
    header: () =>
      h(
        ULink,
        {
          class: "hover-link default-link",
          to: { name: "tournament", params: { id: "560", name: "us-open" } }
        },
        () => "US Open"
      ),
    columns: [
      {
        accessorKey: "560.singles",
        header: () =>
          h(UBadge, {
            color: "Singles",
            label: "Singles",
            class: "w-full"
          }),
        cell: ({ row, cell }) => {
          if (cell.getValue()) {
            return h(
              ULink,
              {
                class:
                  "hover-link " +
                  (cell.getValue() === "Win"
                    ? "uppercase success-link font-semibold"
                    : cell.getValue() === "Final"
                    ? "primary-link"
                    : "default-link"),
                to: {
                  name: "edition",
                  params: {
                    id: "560",
                    name: "us-open",
                    edId: `560${row.original.year}-${tour}`,
                    year: row.original.year
                  }
                }
              },
              () => cell.getValue() as string
            )
          } else {
            return cell.renderValue()
          }
        }
      },
      {
        accessorKey: "560.doubles",
        header: () =>
          h(UBadge, {
            color: "Doubles",
            label: "Doubles",
            class: "w-full"
          }),
        cell: ({ row, cell }) => {
          if (cell.getValue()) {
            return h(
              ULink,
              {
                class:
                  "hover-link " +
                  (cell.getValue() === "Win"
                    ? "uppercase success-link font-semibold"
                    : cell.getValue() === "Final"
                    ? "primary-link"
                    : "default-link"),
                to: {
                  name: "edition",
                  params: {
                    id: "560",
                    name: "us-open",
                    edId: `560${row.original.year}-${tour}`,
                    year: row.original.year
                  }
                }
              },
              () => cell.getValue() as string
            )
          } else {
            return cell.renderValue()
          }
        }
      }
    ]
  }),
  recordColumnHelper.group({
    id: "finals",
    header: () =>
      h(
        ULink,
        {
          class: "hover-link default-link",
          to: { name: "tournament", params: { id: tour === "WTA" ? "808" : "605", name: "finals" } }
        },
        () => "Finals"
      ),
    columns: [
      {
        accessorKey: `${tour === "WTA" ? "808" : "605"}.singles`,
        header: () =>
          h(UBadge, {
            color: "Singles",
            label: "Singles",
            class: "w-full"
          }),
        cell: ({ row, cell }) => {
          if (cell.getValue()) {
            return h(
              ULink,
              {
                class:
                  "hover-link " +
                  (cell.getValue() === "Win"
                    ? "uppercase success-link font-semibold"
                    : cell.getValue() === "Final"
                    ? "primary-link"
                    : "default-link"),
                to: {
                  name: "edition",
                  params: {
                    id: tour === "WTA" ? "808" : "605",
                    name: "finals",
                    edId: `${tour === "WTA" ? "808" : "605"}${row.original.year}-${tour}`,
                    year: row.original.year
                  }
                }
              },
              () => cell.getValue() as string
            )
          } else {
            return cell.renderValue()
          }
        }
      },
      {
        accessorKey: `${tour === "WTA" ? "808" : "605"}.doubles`,
        header: () =>
          h(UBadge, {
            color: "Doubles",
            label: "Doubles",
            class: "w-full"
          }),
        cell: ({ row, cell }) => {
          if (cell.getValue()) {
            return h(
              ULink,
              {
                class:
                  "hover-link " +
                  (cell.getValue() === "Win"
                    ? "uppercase success-link font-semibold"
                    : cell.getValue() === "Final"
                    ? "primary-link"
                    : "default-link"),
                to: {
                  name: "edition",
                  params: {
                    id: tour === "WTA" ? "808" : "605",
                    name: "finals",
                    edId: `${tour === "WTA" ? "808" : "605"}${row.original.year}-${tour}`,
                    year: row.original.year
                  }
                }
              },
              () => cell.getValue() as string
            )
          } else {
            return cell.renderValue()
          }
        }
      }
    ]
  }),
  recordColumnHelper.group({
    id: "olympics",
    header: () =>
      h(
        ULink,
        {
          class: "hover-link default-link",
          to: { name: "tournament", params: { id: "96", name: "olympics" } }
        },
        () => "Olympics"
      ),
    columns: [
      {
        accessorKey: "96.singles",
        header: () =>
          h(UBadge, {
            color: "Singles",
            label: "Singles",
            class: "w-full"
          }),
        cell: ({ row, cell }) => {
          if (cell.getValue()) {
            return h(
              ULink,
              {
                class:
                  "hover-link " +
                  (cell.getValue() === "Win"
                    ? "uppercase success-link font-semibold"
                    : cell.getValue() === "Final"
                    ? "primary-link"
                    : "default-link"),
                to: {
                  name: "edition",
                  params: {
                    id: "96",
                    name: "olympics",
                    edId: `96${row.original.year}-${tour}`,
                    year: row.original.year
                  }
                }
              },
              () => cell.getValue() as string
            )
          } else {
            return cell.renderValue()
          }
        }
      },
      {
        accessorKey: "96.doubles",
        header: () =>
          h(UBadge, {
            color: "Doubles",
            label: "Doubles",
            class: "w-full"
          }),
        cell: ({ row, cell }) => {
          if (cell.getValue()) {
            return h(
              ULink,
              {
                class:
                  "hover-link " +
                  (cell.getValue() === "Win"
                    ? "uppercase success-link font-semibold"
                    : cell.getValue() === "Final"
                    ? "primary-link"
                    : "default-link"),
                to: {
                  name: "edition",
                  params: {
                    id: "96",
                    name: "olympics",
                    edId: `96${row.original.year}-${tour}`,
                    year: row.original.year
                  }
                }
              },
              () => cell.getValue() as string
            )
          } else {
            return cell.renderValue()
          }
        }
      }
    ]
  })
]
