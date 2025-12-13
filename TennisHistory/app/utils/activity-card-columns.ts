import { PlayersLink, UBadge, UButton, UIcon } from "#components"
import type { TableColumn } from "@nuxt/ui"
import appConfig from "~/app.config"

const columns = (event: ConsolidatedActivityType, id: string, name: string): TableColumn<ActivityMatchType>[] => [
  { accessorKey: "round", header: "Round" },
  {
    id: "opponent",
    header: "Opponent",
    cell: ({ row }) => {
      if (row.original.opponent?.team.length) {
        return h(
          "div",
          { class: "flex flex-col" },
          row.original.opponent.team.map(p => h(PlayersLink, { player: p }))
        )
      }
    }
  },
  {
    id: "rank",
    header: "Rank",
    cell: ({ row }) => {
      if (row.original.opponent?.team.length) {
        return h(
          "div",
          { class: "flex flex-col" },
          row.original.opponent.team.map(p => p.rank?.toLocaleString() ?? "—")
        )
      }
    }
  },
  {
    accessorKey: "winning_team",
    header: "",
    cell: ({ row }) =>
      h(UIcon, {
        name: row.original.winning_team === "t1" ? appConfig.ui.icons.success : appConfig.ui.icons.error,
        class: (row.original.winning_team === "t1" ? "text-success" : "text-error") + " text-lg"
      })
  },
  {
    id: "score",
    header: "Score",
    cell: ({ row }) =>
      h(
        "div",
        { class: "flex justify-center items-center" },
        [
          row.original.sets?.[0]?.length &&
            h(
              "div",
              { class: "flex items-center gap-1 mr-2" },
              row.original.sets[0].map((set, index) =>
                h(
                  "span",
                  { key: index },
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
  },
  {
    id: "h2h",
    header: "",
    cell: ({ row }) => {
      if (row.original.opponent?.team.length) {
        const p1Name = event.partner ? `${name}+${kebabCase(`${event.partner.first_name} ${event.partner.last_name}`)}` : name
        const p1Id = event.partner ? `${id}+${event.partner.id}` : id

        return h(UButton, {
          to: {
            name: "head-to-head",
            params: {
              p1Name,
              p1Id,
              p2Name: row.original.opponent.team.map(p => kebabCase(`${p.first_name} ${p.last_name}`)).join("+"),
              p2Id: row.original.opponent.team.map(p => p.id).join("+")
            }
          },
          label: "H2H",
          icon: ICONS.h2h
        })
      }
    }
  }
]

export default columns
