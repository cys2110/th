import type { TableColumn } from "@nuxt/ui"
import type { Column, Row } from "@tanstack/vue-table"
import { TableClientFilterHeader, TableClientGroupHeader, TableClientSortHeader, TableRowToggle, UIcon } from "#components"

export const countriesColumns: TableColumn<CountryType>[] = [
  {
    accessorKey: "name",
    aggregationFn: "uniqueCount",
    header: ({ column }) =>
      h("div", { class: "flex justify-center items-center gap-0.5" }, [
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Country",
          icon: ICONS.globe
        }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ]),
    cell: ({ cell, row }) => {
      if (row.getIsGrouped()) {
        const count = cell.getValue<number>()

        return `${count} countr${count === 1 ? "y" : "ies"}`
      } else {
        return h("div", { class: "flex justify-start items-center gap-2" }, [h(UIcon, { name: getFlagCode(row.original) }), cell.getValue<string>()])
      }
    }
  },
  {
    accessorKey: "continent",
    header: ({ column }) =>
      h("div", { class: "flex justify-center items-center gap-0.5" }, [
        h(TableClientGroupHeader, {
          column: column as Column<unknown>
        }),
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Continent",
          icon: "icon-park-twotone:globe"
        }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ]),
    cell: ({ cell, row, table }) => {
      const continent = cell.getValue<string>()

      if (row.getIsGrouped()) {
        return h(
          TableRowToggle,
          {
            row: row as Row<unknown>,
            isExpanded: row.getIsExpanded()
          },
          () => continent
        )
      } else if (!table.getState().grouping.length) {
        return continent
      }
    }
  }
]
