import { PlayersLink, UBadge, UButton, UIcon, ULink } from "#components"
import type { TableColumn } from "@nuxt/ui"
import appConfig from "~/app.config"

const columns = (id: string, name: string): TableColumn<ActivityType>[] =>
  [
    {
      accessorKey: "year",
      header: "Year",
      cell: ({ row }: { row: { original: ActivityType } }) =>
        h(
          ULink,
          {
            class: "hover-link default-link",
            to: {
              name: "edition",
              params: {
                id: row.original.tournament.id,
                name: kebabCase(row.original.tournament.name),
                year: row.original.year,
                edId: row.original.id
              }
            }
          },
          () => row.original.year
        )
    },
    { accessorKey: "level", header: "Level" },
    {
      accessorKey: "tournament.name",
      header: "Tournament",
      cell: ({ row }: { row: { original: ActivityType } }) =>
        h(
          ULink,
          {
            class: "hover-link default-link",
            to: { name: "tournament", params: { id: row.original.tournament.id, name: kebabCase(row.original.tournament.name) } }
          },
          () => row.original.tournament.name
        )
    },
    { accessorKey: "category", header: "Category" },
    { accessorKey: "match.round", header: "Round" },
    {
      accessorKey: "partner",
      header: "Partner",
      cell: ({ row }: { row: { original: ActivityType } }) => {
        if (row.original.partner) {
          return h(PlayersLink, { player: row.original.partner })
        }
      }
    },
    {
      id: "opponent",
      header: "Opponent",
      cell: ({ row }: { row: { original: ActivityType } }) => {
        if (row.original.match.opponent?.team.length) {
          return h(
            "div",
            { class: "flex flex-col" },
            row.original.match.opponent.team.map(p => h(PlayersLink, { player: p }))
          )
        }
      }
    },
    {
      id: "rank",
      header: "Rank",
      cell: ({ row }: { row: { original: ActivityType } }) => {
        if (row.original.match.opponent?.team.length) {
          return h(
            "div",
            { class: "flex flex-col" },
            row.original.match.opponent.team.map(p => p.rank?.toLocaleString() ?? "—")
          )
        }
      }
    },
    {
      accessorKey: "match.winning_team",
      header: "",
      cell: ({ row }: { row: { original: ActivityType } }) =>
        h(UIcon, {
          name: row.original.match.winning_team === "t1" ? appConfig.ui.icons.success : appConfig.ui.icons.error,
          class: (row.original.match.winning_team === "t1" ? "text-success" : "text-error") + " text-lg"
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
            row.original.match.sets?.[0]?.length &&
              h(
                "div",
                { class: "flex items-center gap-1 mr-2" },
                row.original.match.sets[0].map((set, index) =>
                  h(
                    "span",
                    { key: index },
                    [
                      `${set[0]}${row.original.match.sets![1]![index]![0]}`,
                      isDefined(set[1]) &&
                        isDefined(row.original.match.sets![1]![index]![1]) &&
                        h("sup", {}, set[1] < row.original.match.sets![1]![index]![1] ? set[1] : row.original.match.sets![1]![index]![1])
                    ].filter(Boolean)
                  )
                )
              ),
            row.original.match.incomplete &&
              h(UBadge, {
                label: row.original.match.incomplete,
                color: "error"
              })
          ].filter(Boolean)
        )
    },
    {
      id: "h2h",
      header: "",
      cell: ({ row }: { row: { original: ActivityType } }) => {
        if (row.original.match.opponent?.team.length) {
          const p1Name = row.original.partner ? `${name}+${kebabCase(`${row.original.partner.first_name} ${row.original.partner.last_name}`)}` : name
          const p1Id = row.original.partner ? `${id}+${row.original.partner.id}` : id

          return h(UButton, {
            to: {
              name: "head-to-head",
              params: {
                p1Name,
                p1Id,
                p2Name: row.original.match.opponent.team.map(p => kebabCase(`${p.first_name} ${p.last_name}`)).join("+"),
                p2Id: row.original.match.opponent.team.map(p => p.id).join("+")
              }
            },
            label: "H2H",
            icon: ICONS.h2h
          })
        }
      }
    }
  ] as TableColumn<ActivityType>[]

export default columns
