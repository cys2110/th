import { PlayersLink, UBadge, UButton, UInputMenu } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import appConfig from "~/app.config"

const columns: TableColumn<TeamEntryType>[] = [
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
    accessorKey: "team",
    aggregationFn: "uniqueCount",
    header: "Team",
    cell: ({ row, cell }) => {
      if (row.getIsGrouped()) {
        return `${cell.getValue()} teams`
      } else {
        return row.original.team.map(player =>
          h(PlayersLink, {
            key: player.id,
            player,
            strikethrough: row.original.withdrew
          })
        )
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
  {
    accessorKey: "type",
    header: ({ column }) =>
      h(UButton, {
        label: "S/D",
        icon: column.getIsGrouped() ? ICONS.ungroup : ICONS.group,
        variant: "ghost",
        color: "neutral",
        onClick: () => column.toggleGrouping()
      }),
    cell: ({ row }) => {
      if (!row.getIsGrouped()) {
        return h(UBadge, {
          label: row.original.type,
          color: row.original.type,
          class: "my-2"
        })
      }
    }
  },
  {
    accessorKey: "draws",
    header: "Draws",
    cell: ({ row }) => {
      if (!row.getIsGrouped()) {
        return h(
          "div",
          { class: "flex justify-center items-center gap-2 py-2" },
          row.original.draws.map(draw =>
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
    id: "seed",
    accessorFn: row => row.seed ?? (row.q_seed ? `Q-${row.q_seed}` : undefined),
    sortingFn: (rowA: TableRow<TeamEntryType>, rowB: TableRow<TeamEntryType>, columnId: string) => {
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
    id: "status",
    accessorFn: row => {
      if (row.status && row.q_status) {
        return `${statusEnum[row.status]} / Q-${statusEnum[row.q_status]}`
      } else if (row.status) {
        return statusEnum[row.status]
      } else if (row.q_status) {
        return `Q-${statusEnum[row.q_status]}`
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
    accessorKey: "rank",
    sortingFn: (rowA: TableRow<TeamEntryType>, rowB: TableRow<TeamEntryType>, columnId: string) => {
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
        if (row.original.team.length === 2) {
          return h(
            "div",
            {
              class: "flex items-center justify-center gap-2"
            },
            [
              h(
                "div",
                {},
                row.original.team.map(player =>
                  h(
                    "div",
                    {
                      key: player.id
                    },
                    player.rank
                  )
                )
              ),
              h("div", {}, `[${cell.getValue()}]`)
            ]
          )
        } else {
          return cell.getValue()
        }
      }
    }
  }
]

export default columns
