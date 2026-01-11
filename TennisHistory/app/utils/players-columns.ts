import { CountryLink, DevOnly, PersonUpdate, UBadge, UButton, ULink } from "#components"
import type { TableColumn } from "@nuxt/ui"
import appConfig from "~/app.config"

const currentYear = new Date().getFullYear()

const columns: TableColumn<BasePlayerType>[] = [
  {
    accessorKey: "tour",
    header: ({ column }) =>
      h(UButton, {
        label: "Tour",
        icon: column.getIsGrouped() ? ICONS.ungroup : ICONS.group,
        variant: "ghost",
        color: "neutral",
        onClick: () => column.toggleGrouping()
      }),
    cell: ({ cell, row, table }) => {
      const tour = cell.getValue<keyof typeof tourEnum>()

      return h("div", { class: `flex items-center ${row.getIsGrouped() ? "py-2" : "py-1 justify-center"}` }, [
        row.getIsGrouped() &&
          row.groupingColumnId === "tour" &&
          h("span", {
            class: "inline-block",
            style: { width: `${(row.depth ?? 0) * 1}rem` }
          }),
        row.getIsGrouped() &&
          row.groupingColumnId === "tour" &&
          h(UButton, {
            variant: "ghost",
            color: "neutral",
            class: "mr-2",
            icon: row.getIsExpanded() ? appConfig.ui.icons.minus : appConfig.ui.icons.plus,
            onClick: () => row.toggleExpanded()
          }),
        ((row.getIsGrouped() && row.groupingColumnId === "tour") || (!row.getIsGrouped() && !table.getState().grouping.includes("tour"))) &&
          h(UBadge, {
            label: tour,
            color: tour as keyof typeof appConfig.ui.colors
          })
      ])
    }
  },
  {
    id: "status",
    accessorFn: row => (row.max_year === currentYear ? "Active" : "Inactive"),
    header: ({ column }) =>
      h(UButton, {
        label: "Status",
        icon: column.getIsGrouped() ? ICONS.ungroup : ICONS.group,
        variant: "ghost",
        color: "neutral",
        onClick: () => column.toggleGrouping()
      }),
    cell: ({ cell, row, table }) => {
      const status = cell.getValue<keyof typeof appConfig.ui.colors>()

      return h("div", { class: `flex items-center ${row.getIsGrouped() ? "py-2" : "py-1 justify-center"}` }, [
        row.getIsGrouped() &&
          row.groupingColumnId === "status" &&
          h("span", {
            class: "inline-block",
            style: { width: `${(row.depth ?? 0) * 1}rem` }
          }),
        row.getIsGrouped() &&
          row.groupingColumnId === "status" &&
          h(UButton, {
            variant: "ghost",
            color: "neutral",
            class: "mr-2",
            icon: row.getIsExpanded() ? appConfig.ui.icons.minus : appConfig.ui.icons.plus,
            onClick: () => row.toggleExpanded()
          }),
        ((row.getIsGrouped() && row.groupingColumnId === "status") || (!row.getIsGrouped() && !table.getState().grouping.includes("status"))) &&
          h(UBadge, {
            label: status,
            color: status
          })
      ])
    }
  },
  {
    id: "country",
    accessorKey: "country.id",
    header: ({ column }) =>
      h(UButton, {
        label: "Country",
        icon: column.getIsGrouped() ? ICONS.ungroup : ICONS.group,
        variant: "ghost",
        color: "neutral",
        onClick: () => column.toggleGrouping()
      }),
    cell: ({ row, table }) => {
      return h("div", { class: `flex items-center ${row.getIsGrouped() ? "py-2" : "py-1 justify-center"}` }, [
        row.getIsGrouped() &&
          row.groupingColumnId === "country" &&
          h("span", {
            class: "inline-block",
            style: { width: `${(row.depth ?? 0) * 1}rem` }
          }),
        row.getIsGrouped() &&
          row.groupingColumnId === "country" &&
          h(UButton, {
            variant: "ghost",
            color: "neutral",
            class: "mr-2",
            icon: row.getIsExpanded() ? appConfig.ui.icons.minus : appConfig.ui.icons.plus,
            onClick: () => row.toggleExpanded()
          }),
        ((row.getIsGrouped() && row.groupingColumnId === "country") || (!row.getIsGrouped() && !table.getState().grouping.includes("country"))) &&
          row.original.country &&
          h(CountryLink, {
            country: row.original.country,
            iconOnly: row.getIsGrouped() ? false : true,
            class: row.getIsGrouped() && "mx-0"
          })
      ])
    }
  },
  {
    accessorKey: "id",
    aggregationFn: "uniqueCount",
    header: "Player",
    cell: ({ cell, row }) => {
      if (row.getIsGrouped()) {
        return `${cell.getValue()} player${cell.getValue<number>() > 1 ? "s" : ""}`
      } else {
        return `${row.original.first_name} ${row.original.last_name}`
      }
    }
  },
  {
    accessorKey: "min_year",
    aggregationFn: "extent",
    header: ({ column }) =>
      h(UButton, {
        label: "Year of First Tournament",
        icon: column.getIsGrouped() ? ICONS.ungroup : ICONS.group,
        variant: "ghost",
        color: "neutral",
        onClick: () => column.toggleGrouping()
      }),
    cell: ({ cell, row, table }) => {
      if (row.getIsGrouped() && row.groupingColumnId === "min_year") {
        return h("div", { class: `flex items-center ${row.getIsGrouped() ? "py-1" : "py-1 justify-center"}` }, [
          row.getIsGrouped() &&
            h("span", {
              class: "inline-block",
              style: { width: `${(row.depth ?? 0) * 1}rem` }
            }),
          row.getIsGrouped() &&
            h(UButton, {
              variant: "ghost",
              color: "neutral",
              class: "mr-2",
              icon: row.getIsExpanded() ? appConfig.ui.icons.minus : appConfig.ui.icons.plus,
              onClick: () => row.toggleExpanded()
            }),
          cell.getValue() as number
        ])
      } else if (row.getIsGrouped() && !table.getState().grouping.includes("min_year")) {
        const [min, max] = cell.getValue<number[]>()
        return min === max ? `${min}` : `${min} - ${max}`
      } else if (!row.getIsGrouped() && !table.getState().grouping.includes("min_year")) {
        return cell.renderValue()
      }
    }
  },
  {
    accessorKey: "max_year",
    aggregationFn: "extent",
    header: ({ column }) =>
      h(UButton, {
        label: "Year of Last Tournament",
        icon: column.getIsGrouped() ? ICONS.ungroup : ICONS.group,
        variant: "ghost",
        color: "neutral",
        onClick: () => column.toggleGrouping()
      }),
    cell: ({ cell, row, table }) => {
      if (row.getIsGrouped() && row.groupingColumnId === "max_year") {
        return h("div", { class: `flex items-center ${row.getIsGrouped() ? "py-1" : "py-1 justify-center"}` }, [
          row.getIsGrouped() &&
            h("span", {
              class: "inline-block",
              style: { width: `${(row.depth ?? 0) * 1}rem` }
            }),
          row.getIsGrouped() &&
            h(UButton, {
              variant: "ghost",
              color: "neutral",
              class: "mr-2",
              icon: row.getIsExpanded() ? appConfig.ui.icons.minus : appConfig.ui.icons.plus,
              onClick: () => row.toggleExpanded()
            }),
          cell.getValue() as number
        ])
      } else if (row.getIsGrouped() && !table.getState().grouping.includes("max_year")) {
        const [min, max] = cell.getValue<number[]>()
        return min === max ? `${min}` : `${min} - ${max}`
      } else if (!row.getIsGrouped() && !table.getState().grouping.includes("max_year")) {
        return cell.renderValue()
      }
    }
  },
  {
    accessorKey: "coaches",
    header: "Coaches",
    cell: ({ row }) => {
      if (!row.getIsGrouped()) {
        if (row.original.coaches?.length) {
          return row.original.coaches.map(coach =>
            h("div", { key: coach.id, class: "flex flex-col justify-center" }, [
              h(
                DevOnly,
                {},
                {
                  default: () => h(PersonUpdate, { type: "Coach", person: coach }),
                  fallback: () =>
                    h("div", {}, [
                      coach.labels!.includes("Player")
                        ? h(
                            ULink,
                            {
                              class: "hover-link default-link w-fit mx-auto"
                            },
                            () => `${coach.first_name} ${coach.last_name}`
                          )
                        : h("span", {}, `${coach.first_name} ${coach.last_name}`),
                      coach.years ? h("span", {}, ` (${coach.years})`) : null
                    ])
                }
              )
            ])
          )
        } else {
          return "—"
        }
      }
    }
  }
]

export default columns
