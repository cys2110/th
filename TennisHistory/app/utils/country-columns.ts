import { UIcon } from "#components"
import type { TableColumn } from "@nuxt/ui"

const columns: TableColumn<CountryType>[] = [
  { accessorKey: "id", header: "", cell: ({ row }) => h(UIcon, { name: getFlagCode(row.original), class: "size-5" }) },
  { accessorKey: "name", header: "Country" },
  { accessorKey: "continent", header: "Continent" }
]

export default columns
