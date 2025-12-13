import { UProgress } from "#components"
import type { TableColumn } from "@nuxt/ui"

const columns: TableColumn<WLIndexType>[] = [
  { accessorKey: "category", header: "Category" },
  { accessorKey: "stat", header: "Stat" },
  { id: "wl", accessorFn: row => `${row.wins}-${row.losses}`, header: "Win-Loss" },
  {
    accessorKey: "value",
    header: "Index",
    cell: ({ row }) =>
      h(
        UProgress,
        {
          modelValue: row.original.value,
          max: 1,
          ui: {
            root: "min-w-60 md:min-w-sm",
            base: "bg-Inactive-300 dark:bg-Inactive-800",
            indicator: "bg-Inactive-600 dark:bg-Inactive-500"
          }
        },
        {
          status: () => row.original.value.toFixed(3)
        }
      )
  },
  { accessorKey: "titles", header: "Titles" }
]

export default columns
