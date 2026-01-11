import { PlayerLink, UBadge, ULink } from "#components"
import type { TableColumn } from "@nuxt/ui"

const columns = (teams: { team1: H2HTeamType; team2: H2HTeamType }): TableColumn<H2HMatchType>[] => [
  {
    accessorKey: "year",
    header: "Year",
    cell: ({ row }) =>
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
  {
    accessorKey: "winning_team",
    header: "Winner",
    cell: ({ row }) =>
      h(
        "div",
        { class: "flex flex-col items-center" },
        (row.original.winning_team === "t1" ? teams.team1.players : teams.team2.players).map(p =>
          h(PlayerLink, { key: p.id, player: p as PersonType })
        )
      )
  },
  { accessorKey: "level", header: "Level", cell: ({ row }) => h(UBadge, { label: row.original.level, color: row.original.level }) },
  {
    accessorKey: "tournament.name",
    header: "Tournament",
    cell: ({ row }) =>
      h(
        ULink,
        {
          class: "hover-link default-link",
          to: {
            name: "tournament",
            params: {
              id: row.original.tournament.id,
              name: kebabCase(row.original.tournament.name)
            }
          }
        },
        () => row.original.tournament.name
      )
  },
  { accessorKey: "round", header: "Round" },
  { accessorKey: "surface.id", header: "Surface" },
  {
    id: "score",
    header: "Score",
    cell: ({ row }) =>
      h("div", { class: "flex justify-center items-center" }, [
        row.original.sets?.[0]?.length &&
          h(
            "div",
            { class: "flex items-center gap-1 mr-2" },
            row.original.sets[0].map((set, index) =>
              h("span", { key: index }, [
                `${set[0]}${row.original.sets[1]![index]![0]}`,
                isDefined(set[1]) &&
                  isDefined(row.original.sets[1]![index]![1]) &&
                  h("sup", {}, set[1] < row.original.sets[1]![index]![1] ? set[1] : row.original.sets[1]![index]![1])
              ])
            )
          ),
        row.original.incomplete &&
          h(UBadge, {
            label: row.original.incomplete,
            color: "error"
          })
      ])
  }
]

export default columns
