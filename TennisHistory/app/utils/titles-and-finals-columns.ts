import { UBadge, ULink } from "#components"
import type { TableColumn } from "@nuxt/ui"

const columns = computed<TableColumn<TitlesAndFinalsType>[]>(() => [
  { accessorKey: "date", header: "Date", cell: ({ row }) => useDateFormat(row.original.date, "DD MMMM YYYY").value },
  {
    accessorKey: "tournament.name",
    header: "Tournament",
    cell: ({ row }) =>
      h(
        ULink,
        {
          class: "hover-link default-link",
          to: { name: "tournament", params: { id: row.original.tournament.id, name: kebabCase(row.original.tournament.name) } }
        },
        () => row.original.tournament.name
      )
  },
  { accessorKey: "type", header: "S/D", cell: ({ row }) => h(UBadge, { label: row.original.type, color: row.original.type }) },
  { accessorKey: "level", header: "Level", cell: ({ row }) => h(UBadge, { label: row.original.level, color: row.original.level }) },
  { accessorKey: "category", header: "Category" },
  { accessorKey: "surface.id", header: "Surface" }
])

export default columns
