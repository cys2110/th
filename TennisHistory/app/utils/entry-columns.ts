import { EditionsEntriesUpdate, PlayersLink, UBadge, UButton, UInputMenu, ULink } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import { createColumnHelper } from "@tanstack/vue-table"
import appConfig from "~/app.config"

const columnHelper = createColumnHelper<PlayerEntryType>()

const columns = (refresh: () => void): TableColumn<PlayerEntryType>[] => [
  {
    id: "expand",
    header: "",
    cell: ({ row }) => {
      if (row.getIsGrouped()) {
        return h(
          "div",
          {
            class: "flex items-center py-2"
          },
          [
            h("span", {
              class: "inline-block",
              style: { width: `${(row.depth ?? 0) * 1}rem` }
            }),
            h(UButton, {
              variant: "outline",
              color: "neutral",
              class: "mr-2",
              icon: row.getIsExpanded() ? appConfig.ui.icons.minus : appConfig.ui.icons.plus,
              onClick: () => row.toggleExpanded()
            }),
            h(UBadge, {
              label: `${row.getGroupingValue(row.groupingColumnId as string)}`,
              color: row.getGroupingValue(row.groupingColumnId as string) as keyof typeof appConfig.ui.colors
            })
          ]
        )
      }
    }
  },
  {
    id: "player",
    accessorKey: "last_name",
    aggregationFn: "count",
    sortingFn: (rowA: TableRow<PlayerEntryType>, rowB: TableRow<PlayerEntryType>, columnId: string) => {
      // Sort by last name, then first name, then id with undefined names last
      const a = `${rowA.original.last_name}, ${rowA.original.first_name}`
      const b = `${rowB.original.last_name}, ${rowB.original.first_name}`

      if (rowA.original.last_name && rowB.original.last_name) {
        return a.localeCompare(b)
      } else if (!rowA.original.last_name && !rowB.original.last_name) {
        return rowA.original.id.localeCompare(rowB.original.id)
      } else if (!rowA.original.last_name && rowB.original.last_name) {
        return 1
      } else {
        return -1
      }
    },
    header: ({ column }) =>
      h(UButton, {
        label: "Player",
        icon: column.getIsSorted() ? (column.getIsSorted() === "asc" ? ICONS.sortAlphaUp : ICONS.sortAlphaDown) : ICONS.sortAlpha,
        variant: "ghost",
        color: "neutral",
        onClick: () => {
          // Toggle asc -> desc -> none
          if (column.getIsSorted() === "desc") {
            column.clearSorting()
          } else if (!column.getIsSorted()) {
            column.toggleSorting(false, true)
          } else {
            column.toggleSorting(true, true)
          }
        }
      }),
    cell: ({ row, cell }) => {
      if (row.getIsGrouped()) {
        return `${cell.getValue()} players`
      } else {
        if (row.original.last_name) {
          return h(PlayersLink, {
            player: {
              id: row.original.id,
              first_name: row.original.first_name,
              last_name: row.original.last_name,
              country: row.original.country
            },
            class: "my-2"
          })
        } else {
          return h(
            ULink,
            {
              class: "hover-link default-link",
              to: {
                name: "player",
                params: { id: row.original.id, name: "—" }
              },
              target: "_blank"
            },
            () => row.original.id
          )
        }
      }
    }
  },
  {
    accessorKey: "tour",
    header: ({ column }) =>
      h(UButton, {
        label: "Tour",
        icon: column.getIsGrouped() ? ICONS.ungroup : ICONS.group,
        variant: "ghost",
        color: "neutral",
        onClick: () => column.toggleGrouping()
      }),
    cell: ({ row }) => {
      if (!row.getIsGrouped()) {
        return h(UBadge, {
          label: row.original.tour,
          color: row.original.tour,
          class: "my-2"
        })
      }
    }
  },
  columnHelper.group({
    id: "singles",
    header: () =>
      h(UBadge, {
        label: "Singles",
        color: "Singles",
        class: "w-full justify-center"
      }),
    columns: [
      {
        accessorKey: "singles.draws",
        header: "Draws",
        cell: ({ row }) => {
          if (!row.getIsGrouped() && row.original.singles?.draws) {
            return h(
              "div",
              { class: "flex justify-center items-center gap-2 py-2" },
              row.original.singles.draws.map(draw =>
                h(UBadge, {
                  label: draw,
                  color: draw
                })
              )
            )
          }
        }
      },
      {
        id: "singles_seed",
        accessorFn: row => row.singles?.seed ?? (row.singles?.q_seed ? `Q-${row.singles.q_seed}` : undefined),
        sortingFn: (rowA: TableRow<PlayerEntryType>, rowB: TableRow<PlayerEntryType>, columnId: string) => {
          // Sort numbers first, then strings, then undefined
          const a = rowA.getValue(columnId)
          const b = rowB.getValue(columnId)

          if (a === undefined) return 1
          if (b === undefined) return -1

          if (typeof a === "string" && typeof b === "number") return 1
          if (typeof a === "number" && typeof b === "string") return -1

          return (a as number) - (b as number)
        },
        header: ({ column }) =>
          h(UButton, {
            label: "Seed",
            icon: column.getIsSorted() ? (column.getIsSorted() === "asc" ? ICONS.sortNumberUp : ICONS.sortNumberDown) : ICONS.sortNumber,
            variant: "ghost",
            color: "neutral",
            onClick: () => {
              // Toggle asc -> desc -> none
              if (column.getIsSorted() === "desc") {
                column.clearSorting()
              } else if (!column.getIsSorted()) {
                column.toggleSorting(false, true)
              } else {
                column.toggleSorting(true, true)
              }
            }
          }),
        cell: ({ row, cell }) => {
          if (!row.getIsGrouped()) {
            return cell.getValue()
          }
        }
      },
      {
        id: "singles_status",
        accessorFn: row => {
          if (row.singles?.status && row.singles?.q_status) {
            return `${statusEnum[row.singles.status]} / Q-${statusEnum[row.singles.q_status]}`
          } else if (row.singles?.status) {
            return statusEnum[row.singles.status]
          } else if (row.singles?.q_status) {
            return `Q-${statusEnum[row.singles.q_status]}`
          }
        },
        filterFn: "includesString",
        header: ({ column }) =>
          // @ts-expect-error
          h(UInputMenu, {
            placeholder: "Status",
            modelValue: column.getFilterValue(),
            "onUpdate:modelValue": (value: string) => column.setFilterValue(value),
            items: Object.values(statusEnum)
          })
      },
      {
        accessorKey: "singles.rank",
        sortingFn: (rowA: TableRow<PlayerEntryType>, rowB: TableRow<PlayerEntryType>, columnId: string) => {
          // Sort defined ranks first, then zeros, then undefined
          const a = rowA.getValue(columnId)
          const b = rowB.getValue(columnId)

          if (a === undefined) return 1
          if (b === undefined) return -1

          if (a === 0) return 1
          if (b === 0) return -1

          return (a as number) - (b as number)
        },
        aggregationFn: "mean",
        header: ({ column }) =>
          h(UButton, {
            label: "Rank",
            icon: column.getIsSorted() ? (column.getIsSorted() === "asc" ? ICONS.sortNumberUp : ICONS.sortNumberDown) : ICONS.sortNumber,
            variant: "ghost",
            color: "neutral",
            onClick: () => {
              // Toggle asc -> desc -> none
              if (column.getIsSorted() === "desc") {
                column.clearSorting()
              } else if (!column.getIsSorted()) {
                column.toggleSorting(false, true)
              } else {
                column.toggleSorting(true, true)
              }
            }
          }),
        cell: ({ row, cell }) => {
          if (row.getIsGrouped()) {
            return Math.round(cell.getValue() as number)
          } else {
            if (row.original.singles?.draws?.length || row.original.singles?.withdrew) {
              return h(
                EditionsEntriesUpdate,
                {
                  entry: row.original.singles,
                  player: {
                    id: row.original.id,
                    first_name: row.original.first_name,
                    last_name: row.original.last_name,
                    country: row.original.country,
                    tour: tourEnum[row.original.tour]
                  },
                  type: "Singles",
                  refresh
                },
                () => cell.renderValue()
              )
            }
          }
        }
      }
    ]
  }),
  columnHelper.group({
    id: "doubles",
    header: () =>
      h(UBadge, {
        label: "Doubles",
        color: "Doubles",
        class: "w-full justify-center"
      }),
    columns: [
      {
        accessorKey: "doubles.draws",
        header: "Draws",
        cell: ({ row }) => {
          if (!row.getIsGrouped() && row.original.doubles?.draws) {
            return h(
              "div",
              { class: "flex justify-center items-center gap-2 py-2" },
              row.original.doubles.draws.map(draw =>
                h(UBadge, {
                  label: draw,
                  color: draw
                })
              )
            )
          }
        }
      },
      {
        id: "doubles_seed",
        accessorFn: row => row.doubles?.seed ?? (row.doubles?.q_seed ? `Q-${row.doubles.q_seed}` : undefined),
        sortingFn: (rowA: TableRow<PlayerEntryType>, rowB: TableRow<PlayerEntryType>, columnId: string) => {
          // Sort numbers first, then strings, then undefined
          const a = rowA.getValue(columnId)
          const b = rowB.getValue(columnId)

          if (a === undefined) return 1
          if (b === undefined) return -1

          if (typeof a === "string" && typeof b === "number") return 1
          if (typeof a === "number" && typeof b === "string") return -1

          return (a as number) - (b as number)
        },
        header: ({ column }) =>
          h(UButton, {
            label: "Seed",
            icon: column.getIsSorted() ? (column.getIsSorted() === "asc" ? ICONS.sortNumberUp : ICONS.sortNumberDown) : ICONS.sortNumber,
            variant: "ghost",
            color: "neutral",
            onClick: () => {
              // Toggle asc -> desc -> none
              if (column.getIsSorted() === "desc") {
                column.clearSorting()
              } else if (!column.getIsSorted()) {
                column.toggleSorting(false, true)
              } else {
                column.toggleSorting(true, true)
              }
            }
          }),
        cell: ({ row, cell }) => {
          if (!row.getIsGrouped()) {
            return cell.getValue()
          }
        }
      },
      {
        id: "doubles_status",
        accessorFn: row => {
          if (row.doubles?.status && row.doubles?.q_status) {
            return `${statusEnum[row.doubles.status]} / Q-${statusEnum[row.doubles.q_status]}`
          } else if (row.doubles?.status) {
            return statusEnum[row.doubles.status]
          } else if (row.doubles?.q_status) {
            return `Q-${statusEnum[row.doubles.q_status]}`
          }
        },
        filterFn: "includesString",
        header: ({ column }) =>
          // @ts-expect-error
          h(UInputMenu, {
            placeholder: "Status",
            modelValue: column.getFilterValue(),
            "onUpdate:modelValue": (value: string) => column.setFilterValue(value),
            items: Object.values(statusEnum)
          })
      },
      {
        accessorKey: "doubles.rank",
        sortingFn: (rowA: TableRow<PlayerEntryType>, rowB: TableRow<PlayerEntryType>, columnId: string) => {
          // Sort defined ranks first, then zeros, then undefined
          const a = rowA.getValue(columnId)
          const b = rowB.getValue(columnId)

          if (a === undefined) return 1
          if (b === undefined) return -1

          if (a === 0) return 1
          if (b === 0) return -1

          return (a as number) - (b as number)
        },
        aggregationFn: "mean",
        header: ({ column }) =>
          h(UButton, {
            label: "Rank",
            icon: column.getIsSorted() ? (column.getIsSorted() === "asc" ? ICONS.sortNumberUp : ICONS.sortNumberDown) : ICONS.sortNumber,
            variant: "ghost",
            color: "neutral",
            onClick: () => {
              // Toggle asc -> desc -> none
              if (column.getIsSorted() === "desc") {
                column.clearSorting()
              } else if (!column.getIsSorted()) {
                column.toggleSorting(false, true)
              } else {
                column.toggleSorting(true, true)
              }
            }
          }),
        cell: ({ row, cell }) => {
          if (row.getIsGrouped()) {
            return Math.round(cell.getValue() as number)
          } else {
            if (row.original.doubles?.draws?.length || row.original.doubles?.withdrew) {
              return h(
                EditionsEntriesUpdate,
                {
                  entry: row.original.doubles,
                  player: {
                    id: row.original.id,
                    first_name: row.original.first_name,
                    last_name: row.original.last_name,
                    country: row.original.country,
                    tour: tourEnum[row.original.tour]
                  },
                  type: "Doubles",
                  refresh
                },
                () => cell.renderValue()
              )
            }
          }
        }
      }
    ]
  })
]

export default columns
