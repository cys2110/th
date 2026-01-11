import { UBadge } from "#components"
import type { TableColumn } from "@nuxt/ui"
import { createColumnHelper } from "@tanstack/vue-table"
import appConfig from "~/app.config"

const columnHelper = createColumnHelper<WlType>()

const columns: TableColumn<WlType>[] = [
  {
    accessorKey: "label",
    header: "",
    cell: ({ cell }) => {
      const label = cell.getValue<keyof typeof appConfig.ui.colors | "Total">()

      return h(UBadge, {
        label,
        color: label === "Total" ? "primary" : label,
        class: "w-full"
      })
    }
  },
  columnHelper.group({
    id: "total",
    header: () =>
      h(UBadge, {
        label: "Total",
        color: "primary",
        class: "w-full"
      }),
    columns: [
      columnHelper.group({
        id: "total_singles",
        header: () =>
          h(UBadge, {
            label: "Singles",
            color: "Singles",
            class: "w-full"
          }),
        columns: [
          { accessorKey: "total.singles.wl", header: "Win-Loss" },
          { accessorKey: "total.singles.titles", header: "Titles" }
        ]
      }),
      columnHelper.group({
        id: "total_doubles",
        header: () =>
          h(UBadge, {
            label: "Doubles",
            color: "Doubles",
            class: "w-full"
          }),
        columns: [
          { accessorKey: "total.doubles.wl", header: "Win-Loss" },
          { accessorKey: "total.doubles.titles", header: "Titles" }
        ]
      })
    ]
  }),
  columnHelper.group({
    id: "main",
    header: () =>
      h(UBadge, {
        label: "Main",
        color: "Main",
        class: "w-full"
      }),
    columns: [
      columnHelper.group({
        id: "main_singles",
        header: () =>
          h(UBadge, {
            label: "Singles",
            color: "Singles",
            class: "w-full"
          }),
        columns: [
          { accessorKey: "main.singles.wl", header: "Win-Loss" },
          { accessorKey: "main.singles.titles", header: "Titles" }
        ]
      }),
      columnHelper.group({
        id: "main_doubles",
        header: () =>
          h(UBadge, {
            label: "Doubles",
            color: "Doubles",
            class: "w-full"
          }),
        columns: [
          { accessorKey: "main.doubles.wl", header: "Win-Loss" },
          { accessorKey: "main.doubles.titles", header: "Titles" }
        ]
      })
    ]
  }),
  columnHelper.group({
    id: "qualifying",
    header: () =>
      h(UBadge, {
        label: "Qualifying",
        color: "Qualifying",
        class: "w-full"
      }),
    columns: [
      columnHelper.group({
        id: "qualifying_singles",
        header: () =>
          h(UBadge, {
            label: "Singles",
            color: "Singles",
            class: "w-full"
          }),
        columns: [{ accessorKey: "qualifying.singles", header: "" }]
      }),
      columnHelper.group({
        id: "qualifying_doubles",
        header: () =>
          h(UBadge, {
            label: "Doubles",
            color: "Doubles",
            class: "w-full"
          }),
        columns: [{ accessorKey: "qualifying.doubles", header: "" }]
      })
    ]
  })
]

export default columns
