import { UBadge, UButton } from "#components"
import type { TableColumn } from "@nuxt/ui"
import appConfig from "~/app.config"

const levelBadgeMapping: Record<string, keyof typeof appConfig.ui.colors> = {
  "Grand Slam": "primary",
  Masters: "success",
  Finals: "ITF",
  Olympics: "warning"
}

const columns: TableColumn<CountryTitleType>[] = [
  {
    id: "expand",
    header: "",
    cell: ({ row }) => {
      if (row.getCanExpand()) {
        return h(UButton, {
          icon: row.getIsExpanded() ? appConfig.ui.icons.minus : appConfig.ui.icons.plus,
          color: "neutral",
          size: "xs",
          variant: "ghost",
          onClick: row.getToggleExpandedHandler()
        })
      }
    }
  },
  {
    accessorKey: "tour",
    header: "Tour",
    cell: ({ row }) => {
      if (row.getCanExpand()) {
        return h(UBadge, { label: row.original.tour, color: row.original.tour })
      }
    }
  },
  {
    id: "name",
    accessorFn: row => `${row.first_name} ${row.last_name}`,
    header: "Player",
    cell: ({ cell, row }) => {
      if (row.getCanExpand()) {
        return cell.getValue()
      }
    }
  },
  {
    accessorKey: "edition.type",
    header: "S/D",
    cell: ({ row }) => {
      if (row.getCanExpand()) {
        return h(UBadge, { label: row.original.edition.type, color: row.original.edition.type })
      }
    }
  },
  {
    id: "category",
    accessorFn: row => {
      if (["Olympics", "Grand Slam", "Finals"].includes(row.edition.category!)) {
        return row.edition.category
      } else {
        return "Masters"
      }
    },
    header: "Category",
    aggregationFn: "uniqueCount",
    cell: ({ cell, row }) => {
      if (row.getCanExpand()) {
        return `${cell.getValue()} ${cell.getValue() === 1 ? "category" : "categories"}`
      } else {
        return h(UBadge, {
          label: cell.getValue() as string,
          color: levelBadgeMapping[cell.getValue() as string]
        })
      }
    }
  },
  {
    accessorKey: "edition.tournament.name",
    header: "Tournament",
    aggregationFn: "count",
    cell: ({ cell, row }) => {
      if (row.getCanExpand()) {
        return `${cell.getValue()} ${cell.getValue() === 1 ? "title" : "titles"}`
      } else {
        return cell.getValue()
      }
    }
  },
  {
    accessorKey: "edition.year",
    header: "Year",
    aggregationFn: "extent",
    cell: ({ cell, row }) => {
      if (row.getCanExpand()) {
        const [min, max] = cell.getValue<number[]>()
        return min === max ? `${min}` : `${min} - ${max}`
      } else {
        return cell.getValue()
      }
    }
  }
]

export default columns
