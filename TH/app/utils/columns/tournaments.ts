import { FiltersTours, TableServerFilterHeader, TableServerFilterSearchHeader, TableServerSortHeader, UBadge } from "#components"
import type { TableColumn } from "@nuxt/ui"
import appConfig from "~/app.config"

export const tournamentColumns = (
  tours: Ref<string[] | null>,
  tournaments: Ref<OptionType[] | null>,
  established: Ref<number>,
  abolished: Ref<number>,
  sortField: Ref<SortFieldType[]>
): TableColumn<TournamentType>[] => [
  {
    accessorKey: "tours",
    header: () =>
      h(FiltersTours, {
        orientation: "horizontal",
        modelValue: tours.value,
        "onUpdate:modelValue": (val: string[] | undefined) => {
          tours.value = val || []
        }
      }),
    cell: ({ row }) =>
      row.original.tours.map(tour => h(UBadge, { key: tour, label: tour, color: tour as keyof typeof appConfig.ui.colors, class: "mx-0.5" }))
  },
  {
    accessorKey: "name",
    header: () =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableServerFilterSearchHeader, {
          label: "Tournament",
          type: "Tournament",
          multiple: true,
          modelValue: tournaments.value ?? [],
          "onUpdate:modelValue": (val: OptionType | OptionType[] | null | undefined) => {
            tournaments.value = val as OptionType[]
          }
        }),
        h(TableServerSortHeader, {
          sortKey: "name",
          modelValue: sortField.value,
          "onUpdate:modelValue": (val: SortFieldType[] | undefined) => {
            sortField.value = val as SortFieldType[]
          }
        })
      ])
  },
  {
    accessorKey: "established",
    meta: { class: { td: "text-center" } },
    header: () =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableServerFilterHeader, {
          label: "Established",
          options: Array.from({ length: new Date().getFullYear() - 1877 + 1 }, (_, i) => 1877 + i),
          modelValue: established.value,
          "onUpdate:modelValue": (val: number | undefined) => {
            established.value = val as number
          }
        }),
        h(TableServerSortHeader, {
          sortKey: "established",
          modelValue: sortField.value,
          "onUpdate:modelValue": (val: SortFieldType[] | undefined) => {
            sortField.value = val as SortFieldType[]
          }
        })
      ])
  },
  {
    accessorKey: "abolished",
    meta: { class: { td: "text-center" } },
    header: () =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableServerFilterHeader, {
          label: "Abolished",
          options: Array.from({ length: new Date().getFullYear() - 1877 + 1 }, (_, i) => 1877 + i),
          modelValue: abolished.value,
          "onUpdate:modelValue": (val: number | undefined) => {
            abolished.value = val as number
          }
        }),
        h(TableServerSortHeader, {
          sortKey: "abolished",
          modelValue: sortField.value,
          "onUpdate:modelValue": (val: SortFieldType[] | undefined) => {
            sortField.value = val as SortFieldType[]
          }
        })
      ])
  }
]
