<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues, getGroupedRowModel } from "@tanstack/vue-table"

defineProps<{
  country: CountryType
}>()

const {
  params: { id }
} = useRoute("country")
const toast = useToast()
const table = useTemplateRef("table")

// API call
const { data, status, error } = await useFetch("/api/country/big-titles", {
  query: { id },
  default: () => []
})

watch(
  error,
  () => {
    if (error.value) {
      if (error.value.statusMessage === "Validation errors") {
        console.error(error.value.statusMessage, error.value.data?.data.validationErrors)
      } else {
        console.error(error.value)
      }
    }
  },
  { immediate: true }
)

const handleSelectRow = (e: Event, row: TableRow<CountryTitleType>) => {
  // Clear existing toasts
  toast.clear()

  if (row.getIsGrouped()) {
    row.toggleExpanded()
  } else {
    toast.add({
      title: "Go to...",
      progress: false,
      duration: Infinity,
      ui: { root: "border border-primary" },
      actions: [
        {
          icon: ICONS.player,
          label: `${row.original.first_name} ${row.original.last_name}`,
          to: {
            name: "player",
            params: {
              id: row.original.id,
              name: kebabCase(`${row.original.first_name} ${row.original.last_name}`)
            }
          }
        },
        {
          icon: ICONS.trophy,
          label: row.original.edition.tournament.name,
          to: {
            name: "tournament",
            params: {
              id: row.original.edition.tournament.id,
              name: kebabCase(row.original.edition.tournament.name)
            }
          }
        },
        {
          icon: ICONS.calendar,
          label: row.original.edition.year.toString(),
          to: {
            name: "edition",
            params: {
              id: row.original.edition.tournament.id,
              name: kebabCase(row.original.edition.tournament.name),
              year: row.original.edition.year,
              edId: row.original.edition.id
            }
          }
        }
      ]
    })
  }
}

// Clean up toasts on unmount / route leave
onUnmounted(() => {
  toast.clear()
})
onBeforeRouteLeave(() => {
  toast.clear()
})
</script>

<template>
  <dashboard-subpanel
    :title="`Players who have won big titles representing ${country.name}`"
    :icon="ICONS.trophy"
  >
    <template #right>
      <div class="flex items-center gap-2">
        <table-client-clear-filters :table />
        <table-client-clear-sorting :table />
        <table-client-clear-grouping :table />
      </div>
    </template>

    <u-table
      ref="table"
      :data="data"
      :columns="countryTitlesColumns"
      :loading="status === 'pending'"
      sticky
      @select="handleSelectRow"
      :faceted-options="{
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues()
      }"
      :grouping-options="{
        getGroupedRowModel: getGroupedRowModel()
      }"
      :ui="{ td: 'empty:p-0' }"
    >
      <template #loading>
        <loading-icon />
      </template>

      <template #empty>
        <empty
          :message="`No players have won big titles representing ${country.name}`"
          :icon="ICONS.trophyOff"
        />
      </template>
    </u-table>
  </dashboard-subpanel>
</template>
