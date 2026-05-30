import {
  PlayerLink,
  TableClientFilterHeader,
  TableClientGroupHeader,
  TableClientNameFilterHeader,
  TableClientSortHeader,
  UBadge,
  UButton,
  UIcon,
  UInputMenu,
  ULink,
  UProgress
} from "#components"
import type { TableColumn } from "@nuxt/ui"
import { type Column } from "@tanstack/vue-table"
import appConfig from "~/app.config"

export const wlIndexColumns: TableColumn<WLIndexType>[] = [
  {
    accessorKey: "category",
    meta: { class: { th: "text-center" } },
    header: "Category",
    cell: ({ cell, row }) => {
      if (row.getIsGrouped()) {
        return h("div", { class: "flex items-center" }, [
          h(UButton, {
            variant: "ghost",
            class: ["mr-2 transition-transform duration-300 hover:bg-transparent active:bg-transparent", row.getIsExpanded() && "rotate-90"],
            icon: appConfig.ui.icons.chevronDoubleRight,
            onClick: () => row.toggleExpanded()
          }),
          cell.getValue<string>()
        ])
      }
    }
  },
  { accessorKey: "stat", header: "Stat" },
  { id: "wl", accessorFn: row => `${row.wins}-${row.losses}`, meta: { class: { th: "text-center", td: "text-center" } }, header: "Win-Loss" },
  {
    accessorKey: "value",
    aggregationFn: "mean",
    meta: { class: { th: "text-center", td: "text-center" } },
    header: "Index",
    cell: ({ cell, row, table }) => {
      let value = 0

      if (row.getIsGrouped()) {
        if (row.getValue("category") === "Match record") {
          value = table.getRow("0").getValue("value")
        } else {
          value = cell.getValue<number>()
        }
      } else {
        value = cell.getValue<number>()
      }

      return h(
        UProgress,
        {
          modelValue: value,
          max: 1,
          ui: {
            root: "min-w-60 md:min-w-sm",
            base: "bg-Inactive-300 dark:bg-Inactive-800",
            indicator: "bg-Inactive-600 dark:bg-Inactive-500"
          }
        },
        { status: () => value.toFixed(3) }
      )
    }
  },
  {
    accessorKey: "titles",
    meta: { class: { th: "text-center", td: "text-center" } },
    header: "Titles",
    cell: ({ cell, row, table }) => {
      const categoryValue: string = row.getValue("category")
      if (row.getIsGrouped() && categoryValue === "Match record") {
        const value = table.getRow("0").getValue("titles")

        return `${value} title${value !== 1 ? "s" : ""}`
      } else if (!row.getIsGrouped()) {
        const value = cell.getValue<number>()
        return value
      }
    }
  }
]

export const playerStatsColumns: TableColumn<PlayerStatsType>[] = [
  { accessorKey: "stat", header: "" },
  {
    accessorKey: "value",
    meta: { class: { td: "text-right" } },
    header: "",
    cell: ({ row }) => {
      if (row.original.percent) {
        return h(UProgress, {
          modelValue: row.original.value,
          max: 100,
          status: true,
          ui: {
            root: "min-w-60 md:min-w-sm",
            base: "bg-Inactive-300 dark:bg-Inactive-800",
            indicator: "bg-Inactive-600 dark:bg-Inactive-500"
          }
        })
      } else {
        return row.original.value
      }
    }
  }
]
