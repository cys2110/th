<script setup lang="ts">
import { UBadge, UButton } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import { type Column, getGroupedRowModel, type GroupingOptions } from "@tanstack/vue-table"

defineProps<{ country: CountryType }>()
const {
  ui: { icons, colors }
} = useAppConfig()
const {
  params: { id }
} = useRoute("country")

const levelBadgeMapping: Record<string, keyof typeof colors> = {
  "Grand Slam": "primary",
  Masters: "success",
  Finals: "ITF",
  Olympics: "warning"
}

// API call
const { data: results, status } = await useFetch("/api/countries/big-titles", {
  query: { id },
  default: () => []
})

const columns = computed<TableColumn<CountryTitleType>[]>(() => [
  {
    id: "expand",
    header: "",
    cell: ({ row }) => {
      if (row.getCanExpand()) {
        return h(UButton, {
          icon: row.getIsExpanded() ? icons.minus : icons.plus,
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
    header: "Player"
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
        const [min, max] = cell.getValue() as number[]
        if (min === max) {
          return min
        } else {
          return `${min} - ${max}`
        }
      } else {
        return cell.getValue()
      }
    }
  }
])

const grouping = ref<string[]>(["name"])
const grouping_options = ref<GroupingOptions>({
  getGroupedRowModel: getGroupedRowModel(),
  groupedColumnMode: false
})
</script>

<template>
  <dashboard-subpanel
    :title="`Players who have won big titles representing ${country.name}`"
    :icon="ICONS.tournament"
  >
    <u-table
      :data="results"
      :columns
      :loading="status === 'pending'"
      :grouping="grouping"
      :grouping-options="grouping_options"
      :ui="{ tbody: '[&>tr]:cursor-pointer', td: 'empty:p-0' }"
    >
      <template #loading>
        <u-icon
          :name="icons.loading"
          class="size-8"
        />
      </template>
      <template #empty>
        <empty
          :message="`No players have won big titles representing ${country.name}`"
          :icon="ICONS.noTournament"
          class="mx-2"
        />
      </template>
    </u-table>
  </dashboard-subpanel>
</template>
