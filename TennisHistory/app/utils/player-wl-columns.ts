import type { TableColumn } from "@nuxt/ui"
import { createColumnHelper } from "@tanstack/vue-table"

const columnHelper = createColumnHelper<WlType>()

const columns: TableColumn<WlType>[] = [
  {
    accessorKey: "label",
    header: ""
  },
  columnHelper.group({
    header: "Total",
    columns: [
      columnHelper.group({
        header: "Singles",
        columns: [
          { accessorKey: "total.singles.wl", header: "Win-Loss" },
          { accessorKey: "total.singles.titles", header: "Titles" }
        ]
      }),
      columnHelper.group({
        header: "Doubles",
        columns: [
          { accessorKey: "total.doubles.wl", header: "Win-Loss" },
          { accessorKey: "total.doubles.titles", header: "Titles" }
        ]
      })
    ]
  }),
  columnHelper.group({
    header: "Main",
    columns: [
      columnHelper.group({
        header: "Singles",
        columns: [
          { accessorKey: "main.singles.wl", header: "Win-Loss" },
          { accessorKey: "main.singles.titles", header: "Titles" }
        ]
      }),
      columnHelper.group({
        header: "Doubles",
        columns: [
          { accessorKey: "main.doubles.wl", header: "Win-Loss" },
          { accessorKey: "main.doubles.titles", header: "Titles" }
        ]
      })
    ]
  }),
  columnHelper.group({
    header: "Qualifying",
    columns: [
      { accessorKey: "qualifying.singles", header: "Singles" },
      { accessorKey: "qualifying.doubles", header: "Doubles" }
    ]
  })
]

export default columns
