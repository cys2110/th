import { PlayerLink, UBadge, UButton, UInputMenu } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import { createColumnHelper } from "@tanstack/vue-table"
import appConfig from "~/app.config"

const columnHelper = createColumnHelper<ResultMatchType>()

const columns: TableColumn<ResultMatchType>[] = [
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
            row.groupingColumnId === "round_no"
              ? h("div", {}, row.original.round)
              : h(UBadge, {
                  label: `${row.getGroupingValue(row.groupingColumnId as string)}`,
                  color: row.getGroupingValue(row.groupingColumnId as string) as keyof typeof appConfig.ui.colors
                })
          ]
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
    accessorKey: "round_no",
    header: ({ column }) =>
      h(UButton, {
        label: "Round",
        icon: column.getIsGrouped() ? ICONS.ungroup : ICONS.group,
        variant: "ghost",
        color: "neutral",
        onClick: () => column.toggleGrouping()
      }),
    cell: ({ row }) => {
      if (!row.getIsGrouped()) {
        return row.original.round
      }
    }
  },
  {
    accessorKey: "date",
    sortUndefined: 1,
    header: ({ column }) =>
      h(UButton, {
        label: "Date",
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
    cell: ({ row }) => {
      if (!row.getIsGrouped()) {
        return useDateFormat(row.original.date, "dddd MMMM DD YYYY").value
      }
    }
  },
  {
    accessorKey: "duration",
    sortUndefined: 1,
    header: ({ column }) =>
      h(UButton, {
        label: "Duration",
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
    cell: ({ row }) => {
      if (!row.getIsGrouped()) {
        return getDurationString(row.original.duration as number)
      }
    }
  },
  {
    accessorKey: "court",
    aggregationFn: "uniqueCount",
    header: ({ column }) => {
      const sortedUniqueValues = Array.from(column.getFacetedUniqueValues().keys()).sort()

      // @ts-expect-error
      return h(UInputMenu, {
        placeholder: "Court",
        modelValue: column.getFilterValue(),
        "onUpdate:modelValue": (value: string) => column.setFilterValue(value),
        items: sortedUniqueValues
      })
    },
    cell: ({ row, cell }) => {
      if (row.getIsGrouped()) {
        return `${cell.getValue()} courts`
      } else {
        return cell.getValue()
      }
    }
  },
  {
    accessorKey: "umpire.id",
    aggregationFn: "uniqueCount",
    header: ({ column }) => {
      const sortedUniqueValues = Array.from(column.getFacetedUniqueValues().keys()).sort()

      // @ts-expect-error
      return h(UInputMenu, {
        placeholder: "Umpire",
        modelValue: column.getFilterValue(),
        "onUpdate:modelValue": (value: string) => column.setFilterValue(value),
        items: sortedUniqueValues
      })
    },
    cell: ({ row, cell }) => {
      if (row.getIsGrouped()) {
        return `${cell.getValue()} umpires`
      } else {
        return cell.getValue()
      }
    }
  },
  columnHelper.group({
    header: "Winner",
    columns: [
      {
        id: "winner_team",
        accessorFn: row => row.winner.team.map(p => `${p.last_name}, ${p.first_name}`).join(" / "),
        header: ({ column, table }) => {
          const winnerUniqueValues = Array.from(column.getFacetedUniqueValues().keys())
          const loserUniqueValues = Array.from(table.getColumn("loser_team")!.getFacetedUniqueValues().keys())
          const allTeams = Array.from(new Set([...winnerUniqueValues, ...loserUniqueValues])).sort()

          // @ts-expect-error
          return h(UInputMenu, {
            placeholder: "Team",
            modelValue: table.getState().globalFilter,
            "onUpdate:modelValue": (value: string) => table.setGlobalFilter(value),
            items: allTeams
          })
        },
        cell: ({ row }) => {
          if (!row.getIsGrouped()) {
            return row.original.winner.team.map(p =>
              h(PlayerLink, {
                key: p.id,
                player: p,
                class: "mx-auto"
              })
            )
          }
        }
      },
      {
        id: "winner_status",
        header: "Seed/Status",
        cell: ({ row }) => {
          if (!row.getIsGrouped()) {
            const { seed, q_seed, status, q_status } = row.original.winner

            if (row.original.draw === "Main" && (seed || status)) {
              return `${seed ?? ""}${seed && status ? " " : ""}${status ?? ""}`
            }

            if (row.original.draw === "Qualifying" && (q_seed || q_status)) {
              return `${q_seed ?? ""}${q_seed && q_status ? " " : ""}${q_status ?? ""}`
            }
          }
        }
      },
      {
        id: "winner_rank",
        accessorFn: row => {
          if (row.winner.team.length === 1) {
            return row.winner.team[0]?.rank
          } else {
            return row.winner.team.reduce((acc, player) => acc + (player.rank ?? 0), 0)
          }
        },
        aggregationFn: "mean",
        header: "Rank",
        cell: ({ row, cell }) => {
          if (row.getIsGrouped()) {
            return Math.round(cell.getValue() as number)
          } else {
            return cell.getValue()
          }
        }
      }
    ]
  }),
  columnHelper.group({
    header: "Loser",
    columns: [
      {
        id: "loser_team",
        accessorFn: row => row.loser.team.map(p => `${p.last_name}, ${p.first_name}`).join(" / "),
        header: ({ column, table }) => {
          const loserUniqueValues = Array.from(column.getFacetedUniqueValues().keys())
          const winnerUniqueValues = Array.from(table.getColumn("winner_team")!.getFacetedUniqueValues().keys())
          const allTeams = Array.from(new Set([...winnerUniqueValues, ...loserUniqueValues])).sort()

          // @ts-expect-error
          return h(UInputMenu, {
            placeholder: "Team",
            modelValue: table.getState().globalFilter,
            "onUpdate:modelValue": (value: string) => table.setGlobalFilter(value),
            items: allTeams
          })
        },
        cell: ({ row }) => {
          if (!row.getIsGrouped()) {
            return row.original.loser.team.map(p =>
              h(PlayerLink, {
                key: p.id,
                player: p,
                class: "mx-auto"
              })
            )
          }
        }
      },
      {
        id: "loser_status",
        header: "Seed/Status",
        cell: ({ row }) => {
          if (!row.getIsGrouped()) {
            const { seed, q_seed, status, q_status } = row.original.loser

            if (row.original.draw === "Main" && (seed || status)) {
              return `${seed ?? ""}${seed && status ? " " : ""}${status ?? ""}`
            }

            if (row.original.draw === "Qualifying" && (q_seed || q_status)) {
              return `${q_seed ?? ""}${q_seed && q_status ? " " : ""}${q_status ?? ""}`
            }
          }
        }
      },
      {
        id: "loser_rank",
        accessorFn: row => {
          if (row.loser.team.length === 1) {
            return row.loser.team[0]?.rank
          } else {
            return row.loser.team.reduce((acc, player) => acc + (player.rank ?? 0), 0)
          }
        },
        aggregationFn: "mean",
        header: "Rank",
        cell: ({ row, cell }) => {
          if (row.getIsGrouped()) {
            return Math.round(cell.getValue() as number)
          } else {
            return cell.getValue()
          }
        }
      }
    ]
  }),
  {
    id: "score",
    header: "Score",
    cell: ({ row }) => {
      if (!row.getIsGrouped() && row.original.sets?.[0]?.length) {
        return h(
          "div",
          {
            class: "flex justify-center items-center"
          },
          [
            h(
              "div",
              {
                class: "flex items-center gap-1 mr-2"
              },
              row.original.sets?.[0].map((set, index) =>
                h(
                  "span",
                  {
                    key: index
                  },
                  [
                    `${set[0]}${row.original.sets![1]![index]![0]}`,
                    isDefined(set[1]) &&
                      isDefined(row.original.sets![1]![index]![1]) &&
                      h("sup", {}, set[1] < row.original.sets![1]![index]![1] ? set[1] : row.original.sets![1]![index]![1])
                  ].filter(Boolean)
                )
              )
            ),
            row.original.incomplete &&
              h(UBadge, {
                label: row.original.incomplete,
                color: "error"
              })
          ].filter(Boolean)
        )
      }
    }
  },
  {
    id: "h2h",
    header: "",
    cell: ({ row }) =>
      h(UButton, {
        label: "H2H",
        icon: ICONS.h2h,
        to: {
          name: "head-to-head",
          params: {
            p1Name: row.original.winner!.team.map(p => kebabCase(`${p.first_name}-${p.last_name}`)).join("+"),
            p2Name: row.original.loser!.team.map(p => kebabCase(`${p.first_name}-${p.last_name}`)).join("+"),
            p1Id: row.original.winner!.team.map(p => p.id).join("+"),
            p2Id: row.original.loser!.team.map(p => p.id).join("+")
          }
        }
      })
  }
]

export default columns
