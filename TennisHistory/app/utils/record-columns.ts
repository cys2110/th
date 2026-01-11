import { UBadge, ULink } from "#components"
import type { TableColumn } from "@nuxt/ui"
import { createColumnHelper } from "@tanstack/vue-table"

const columnHelper = createColumnHelper<RecordType>()

const columns = (tour: TourEnumType): TableColumn<RecordType>[] => [
  { accessorKey: "year", header: "Year" },
  columnHelper.group({
    id: "australian-open",
    header: () =>
      h(
        ULink,
        {
          class: "hover-link default-link",
          to: { name: "tournament", params: { id: "580", name: "australian-open" } }
        },
        () => "Australian Open"
      ),
    columns: [
      {
        accessorKey: "580.singles",
        header: () =>
          h(UBadge, {
            color: "Singles",
            label: "Singles",
            class: "w-full"
          }),
        cell: ({ row, cell }) => {
          if (cell.getValue()) {
            return h(
              ULink,
              {
                class: "hover-link " + (cell.getValue() === "Win" ? "uppercase primary-link font-semibold" : "default-link"),
                to: {
                  name: "edition",
                  params: {
                    id: "580",
                    name: "australian-open",
                    edId: `580${row.original.year}-${tour}`,
                    year: row.original.year
                  }
                }
              },
              () => cell.getValue() as string
            )
          } else {
            return cell.renderValue()
          }
        }
      },
      {
        accessorKey: "580.doubles",
        header: () =>
          h(UBadge, {
            color: "Doubles",
            label: "Doubles",
            class: "w-full"
          }),
        cell: ({ row, cell }) => {
          if (cell.getValue()) {
            return h(
              ULink,
              {
                class: "hover-link " + (cell.getValue() === "Win" ? "uppercase primary-link font-semibold" : "default-link"),
                to: {
                  name: "edition",
                  params: {
                    id: "580",
                    name: "australian-open",
                    edId: `580${row.original.year}-${tour}`,
                    year: row.original.year
                  }
                }
              },
              () => cell.getValue() as string
            )
          } else {
            return cell.renderValue()
          }
        }
      }
    ]
  }),
  columnHelper.group({
    id: "french-open",
    header: () =>
      h(
        ULink,
        {
          class: "hover-link default-link",
          to: { name: "tournament", params: { id: "520", name: "french-open" } }
        },
        () => "French Open"
      ),
    columns: [
      {
        accessorKey: "520.singles",
        header: () =>
          h(UBadge, {
            color: "Singles",
            label: "Singles",
            class: "w-full"
          }),
        cell: ({ row, cell }) => {
          if (cell.getValue()) {
            return h(
              ULink,
              {
                class: "hover-link " + (cell.getValue() === "Win" ? "uppercase primary-link font-semibold" : "default-link"),
                to: {
                  name: "edition",
                  params: {
                    id: "520",
                    name: "french-open",
                    edId: `520${row.original.year}-${tour}`,
                    year: row.original.year
                  }
                }
              },
              () => cell.getValue() as string
            )
          } else {
            return cell.renderValue()
          }
        }
      },
      {
        accessorKey: "520.doubles",
        header: () =>
          h(UBadge, {
            color: "Doubles",
            label: "Doubles",
            class: "w-full"
          }),
        cell: ({ row, cell }) => {
          if (cell.getValue()) {
            return h(
              ULink,
              {
                class: "hover-link " + (cell.getValue() === "Win" ? "uppercase primary-link font-semibold" : "default-link"),
                to: {
                  name: "edition",
                  params: {
                    id: "520",
                    name: "french-open",
                    edId: `520${row.original.year}-${tour}`,
                    year: row.original.year
                  }
                }
              },
              () => cell.getValue() as string
            )
          } else {
            return cell.renderValue()
          }
        }
      }
    ]
  }),
  columnHelper.group({
    id: "wimbledon",
    header: () =>
      h(
        ULink,
        {
          class: "hover-link default-link",
          to: { name: "tournament", params: { id: "540", name: "wimbledon" } }
        },
        () => "Wimbledon"
      ),
    columns: [
      {
        accessorKey: "540.singles",
        header: () =>
          h(UBadge, {
            color: "Singles",
            label: "Singles",
            class: "w-full"
          }),
        cell: ({ row, cell }) => {
          if (cell.getValue()) {
            return h(
              ULink,
              {
                class: "hover-link " + (cell.getValue() === "Win" ? "uppercase primary-link font-semibold" : "default-link"),
                to: {
                  name: "edition",
                  params: {
                    id: "540",
                    name: "wimbledon",
                    edId: `540${row.original.year}-${tour}`,
                    year: row.original.year
                  }
                }
              },
              () => cell.getValue() as string
            )
          } else {
            return cell.renderValue()
          }
        }
      },
      {
        accessorKey: "540.doubles",
        header: () =>
          h(UBadge, {
            color: "Doubles",
            label: "Doubles",
            class: "w-full"
          }),
        cell: ({ row, cell }) => {
          if (cell.getValue()) {
            return h(
              ULink,
              {
                class: "hover-link " + (cell.getValue() === "Win" ? "uppercase primary-link font-semibold" : "default-link"),
                to: {
                  name: "edition",
                  params: {
                    id: "540",
                    name: "wimbledon",
                    edId: `540${row.original.year}-${tour}`,
                    year: row.original.year
                  }
                }
              },
              () => cell.getValue() as string
            )
          } else {
            return cell.renderValue()
          }
        }
      }
    ]
  }),
  columnHelper.group({
    id: "us-open",
    header: () =>
      h(
        ULink,
        {
          class: "hover-link default-link",
          to: { name: "tournament", params: { id: "560", name: "us-open" } }
        },
        () => "US Open"
      ),
    columns: [
      {
        accessorKey: "560.singles",
        header: () =>
          h(UBadge, {
            color: "Singles",
            label: "Singles",
            class: "w-full"
          }),
        cell: ({ row, cell }) => {
          if (cell.getValue()) {
            return h(
              ULink,
              {
                class: "hover-link " + (cell.getValue() === "Win" ? "uppercase primary-link font-semibold" : "default-link"),
                to: {
                  name: "edition",
                  params: {
                    id: "560",
                    name: "us-open",
                    edId: `560${row.original.year}-${tour}`,
                    year: row.original.year
                  }
                }
              },
              () => cell.getValue() as string
            )
          } else {
            return cell.renderValue()
          }
        }
      },
      {
        accessorKey: "560.doubles",
        header: () =>
          h(UBadge, {
            color: "Doubles",
            label: "Doubles",
            class: "w-full"
          }),
        cell: ({ row, cell }) => {
          if (cell.getValue()) {
            return h(
              ULink,
              {
                class: "hover-link " + (cell.getValue() === "Win" ? "uppercase primary-link font-semibold" : "default-link"),
                to: {
                  name: "edition",
                  params: {
                    id: "560",
                    name: "us-open",
                    edId: `560${row.original.year}-${tour}`,
                    year: row.original.year
                  }
                }
              },
              () => cell.getValue() as string
            )
          } else {
            return cell.renderValue()
          }
        }
      }
    ]
  }),
  columnHelper.group({
    id: "finals",
    header: () =>
      h(
        ULink,
        {
          class: "hover-link default-link",
          to: { name: "tournament", params: { id: tour === "WTA" ? "808" : "605", name: "finals" } }
        },
        () => "Finals"
      ),
    columns: [
      {
        accessorKey: `${tour === "WTA" ? "808" : "605"}.singles`,
        header: () =>
          h(UBadge, {
            color: "Singles",
            label: "Singles",
            class: "w-full"
          }),
        cell: ({ row, cell }) => {
          if (cell.getValue()) {
            return h(
              ULink,
              {
                class: "hover-link " + (cell.getValue() === "Win" ? "uppercase primary-link font-semibold" : "default-link"),
                to: {
                  name: "edition",
                  params: {
                    id: tour === "WTA" ? "808" : "605",
                    name: "finals",
                    edId: `${tour === "WTA" ? "808" : "605"}${row.original.year}-${tour}`,
                    year: row.original.year
                  }
                }
              },
              () => cell.getValue() as string
            )
          } else {
            return cell.renderValue()
          }
        }
      },
      {
        accessorKey: `${tour === "WTA" ? "808" : "605"}.doubles`,
        header: () =>
          h(UBadge, {
            color: "Doubles",
            label: "Doubles",
            class: "w-full"
          }),
        cell: ({ row, cell }) => {
          if (cell.getValue()) {
            return h(
              ULink,
              {
                class: "hover-link " + (cell.getValue() === "Win" ? "uppercase primary-link font-semibold" : "default-link"),
                to: {
                  name: "edition",
                  params: {
                    id: tour === "WTA" ? "808" : "605",
                    name: "finals",
                    edId: `${tour === "WTA" ? "808" : "605"}${row.original.year}-${tour}`,
                    year: row.original.year
                  }
                }
              },
              () => cell.getValue() as string
            )
          } else {
            return cell.renderValue()
          }
        }
      }
    ]
  }),
  columnHelper.group({
    id: "olympics",
    header: () =>
      h(
        ULink,
        {
          class: "hover-link default-link",
          to: { name: "tournament", params: { id: "96", name: "olympics" } }
        },
        () => "Olympics"
      ),
    columns: [
      {
        accessorKey: "96.singles",
        header: () =>
          h(UBadge, {
            color: "Singles",
            label: "Singles",
            class: "w-full"
          }),
        cell: ({ row, cell }) => {
          if (cell.getValue()) {
            return h(
              ULink,
              {
                class: "hover-link " + (cell.getValue() === "Win" ? "uppercase primary-link font-semibold" : "default-link"),
                to: {
                  name: "edition",
                  params: {
                    id: "96",
                    name: "olympics",
                    edId: `96${row.original.year}-${tour}`,
                    year: row.original.year
                  }
                }
              },
              () => cell.getValue() as string
            )
          } else {
            return cell.renderValue()
          }
        }
      },
      {
        accessorKey: "96.doubles",
        header: () =>
          h(UBadge, {
            color: "Doubles",
            label: "Doubles",
            class: "w-full"
          }),
        cell: ({ row, cell }) => {
          if (cell.getValue()) {
            return h(
              ULink,
              {
                class: "hover-link " + (cell.getValue() === "Win" ? "uppercase primary-link font-semibold" : "default-link"),
                to: {
                  name: "edition",
                  params: {
                    id: "96",
                    name: "olympics",
                    edId: `96${row.original.year}-${tour}`,
                    year: row.original.year
                  }
                }
              },
              () => cell.getValue() as string
            )
          } else {
            return cell.renderValue()
          }
        }
      }
    ]
  })
]
export default columns
