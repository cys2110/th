/** @description Column definitions for player related tables */

import {
  CountriesLink,
  TableServerFilterHeader,
  TableServerFilterSearchHeader,
  TableServerGroupHeader,
  TableServerSortHeader,
  UBadge,
  UButton,
  UChip,
  ULink
} from "#components"
import type { TableColumn } from "@nuxt/ui"
import type { Column } from "@tanstack/table-core"
import appConfig from "~/app.config"

const currentYear = new Date().getFullYear()

/**
 * @function playerColumns - return column definitions for players page
 * @param {Ref<string[] | null>} tours - reactive reference to selected tours for filtering
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
