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
const router = useRouter()

// API call
const { data: results, status } = await useFetch("/api/countries/big-titles", {
  query: { id },
  default: () => []
})

const grouping = ref<string[]>(["name"])
const grouping_options = ref<GroupingOptions>({
  getGroupedRowModel: getGroupedRowModel(),
  groupedColumnMode: false
})

const handleSelect = (e: Event, row: TableRow<CountryTitleType>) => {
  if (row.getCanExpand()) {
    router.push({
      name: "player",
      params: {
        id: row.original.id,
        name: kebabCase(`${row.original.first_name} ${row.original.last_name}`)
      }
    })
  } else {
    router.push({
      name: "edition",
      params: {
        id: row.original.edition.tournament.id,
        name: kebabCase(row.original.edition.tournament.name),
        year: row.original.edition.year.toString(),
        edId: row.original.edition.id.toString()
      }
    })
  }
}
</script>

<template>
  <dashboard-subpanel
    :title="`Players who have won big titles representing ${country.name}`"
    :icon="ICONS.tournament"
  >
    <u-table
      :data="results"
      :columns="bigTitlesColumns"
      :loading="status === 'pending'"
      :grouping="grouping"
      :grouping-options="grouping_options"
      @select="handleSelect"
      :ui="{ tbody: '[&>tr]:cursor-pointer', td: 'empty:p-0' }"
    >
      <template #loading>
        <loading-icon />
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
