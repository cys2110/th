import { UProgress } from "#components"
import type { TableColumn } from "@nuxt/ui"

const columns: TableColumn<PlayerStatsType>[] = [
  { accessorKey: "stat", header: "" },
  {
    accessorKey: "value",
    header: "",
    cell: ({ row }) => {
      if (row.original.percent) {
        return h(
          UProgress,
          {
            modelValue: row.original.value,
            max: 100,
            ui: {
              root: "min-w-60 md:min-w-sm",
              base: "bg-Inactive-300 dark:bg-Inactive-800",
              indicator: "bg-Inactive-600 dark:bg-Inactive-500"
            }
          },
          {
            status: () => `${row.original.value}%`
          }
        )
      } else {
        return row.original.value
      }
    }
  }
]

export default columns
