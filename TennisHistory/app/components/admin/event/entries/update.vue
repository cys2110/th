<script setup lang="ts">
import { formatCurrency, getColumnFilter, ICONS, isDefined, prettifyJson, setColumnFilter } from "#imports"
import type { TableColumn } from "@nuxt/ui"
import type { ColumnFiltersState } from "@tanstack/vue-table"

interface Entry {
  pem_id: string
  rank: number | null
  full_name: string
  entry: {
    entry_id: string
    points: number | null
    pm: number | null
    match_type: MatchTypeEnum
  }
}

interface UpdatedEntry {
  [key: string]: {
    player: string
    points: number | null
    pm: number | null
  }
}

interface UpdatedPem {
  [key: string]: {
    player: string
    rank: number | null
  }
}

const selectedEvent = defineModel<EventSelection>({ default: () => ({}) })

const supabase = useSupabaseClient()
const toast = useToast()
const { ui } = useAppConfig()

const entries = ref<Array<Entry>>([])
const loading = ref(false)
const updatedEntries = ref<UpdatedEntry>({})
const updatedMappings = ref<UpdatedPem>({})
const isSaving = ref(false)
const isScraping = ref(false)
const errors = ref<Array<{ id: string; player: string; details: any }>>([])

const fetchEntries = async () => {
  if (!selectedEvent.value.event?.id) return
  set(loading, true)

  const { data, error } = await supabase
    .schema("tennis")
    .from("player_entry_mapping")
    .select(
      `
      pem_id:id,
      rank,
      entry:entries!inner(
        entry_id:id,
        points,
        pm,
        match_type
      ),
      ...player(...people(full_name))
`
    )
    .eq("entries.event_id", selectedEvent.value.event?.id)
    .order("player_id", { ascending: true })

  if (error || !data) {
    console.error("Error fetching entries", error)
    toast.add({
      title: "Error fetching entries",
      description: JSON.stringify(error)
    })
  }
  set(entries, data)
  set(loading, false)
}

defineExpose({ fetchEntries })

watch(
  () => selectedEvent.value.event?.id,
  async () => {
    if (selectedEvent.value.event?.id) {
      await fetchEntries()
    }
  },
  { immediate: true }
)

const columns: Array<TableColumn<Entry>> = [
  { id: "checkbox" },
  { accessorKey: "entry.match_type", header: "S/D" },
  { accessorKey: "full_name", header: "Player" },
  { accessorKey: "rank", header: "Rank" },
  { accessorKey: "entry.points", header: "Points" },
  { accessorKey: "entry.pm", header: "Prize Money" }
]

const columnFilters = ref<ColumnFiltersState>([])

const handleSave = async () => {
  set(isSaving, true)

  const failedEntries: UpdatedEntry = {}
  const failedMappings: UpdatedPem = {}

  for (const [entryId, value] of Object.entries(updatedEntries.value)) {
    const { error } = await supabase.schema("tennis").from("entries").update({ points: value.points, pm: value.pm }).eq("id", entryId)

    if (error) {
      errors.value.push({
        id: entryId,
        player: value.player,
        details: error
      })
      failedEntries[entryId] = value
    }
  }

  for (const [pemId, value] of Object.entries(updatedMappings.value)) {
    const { error } = await supabase.schema("tennis").from("player_entry_mapping").update({ rank: value.rank }).eq("id", pemId)

    if (error) {
      errors.value.push({
        id: pemId,
        player: value.player,
        details: error
      })
      failedMappings[pemId] = value
    }
  }
  set(updatedEntries, failedEntries)
  set(updatedMappings, failedMappings)

  set(isSaving, false)
  await fetchEntries()
}

const handleScrape = async (close: () => void) => {
  set(isScraping, true)

  await $fetch("/api/scrape-activity", {
    query: {
      db_id: selectedEvent.value.tournament?.id,
      year: selectedEvent.value.edition?.year,
      tour: selectedEvent.value.event?.tour,
      edition_no: selectedEvent.value.edition?.edition_no,
      tournament_id: selectedEvent.value.event?.tour === "ATP" ? selectedEvent.value.tournament?.mens_id : selectedEvent.value.tournament?.womens_id
    }
  })
    .then(response => {
      if (!response.success) {
        console.error("Error scraping activity:", response)
        toast.add({
          title: "Error scraping activity",
          description:
            "errors" in response ? `${response.errors.length} player entries could not be updated`
            : "error" in response ? response.error
            : undefined,
          icon: ui.icons.error,
          color: "error"
        })
        return
      }

      toast.add({
        title: "Activity scraped",
        icon: ui.icons.success,
        color: "success"
      })

      close()
    })
    .finally(async () => {
      await fetchEntries()
      set(isScraping, false)
    })
}
</script>

<template>
  <div class="grid grid-cols-3 gap-6 items-start">
    <u-card class="col-span-2">
      <template #header>
        <div class="flex justify-between">
          <div class="space-x-3">
            <u-select-menu
              :items="['Singles', 'Doubles']"
              placeholder="S/D"
              clear
              :model-value="<MatchTypeEnum>getColumnFilter('match_type', columnFilters)"
              @update:model-value="columnFilters = setColumnFilter('match_type', $event, columnFilters)"
            />

            <u-select-menu
              :items="['Main', 'Qualifying']"
              placeholder="Draw"
              clear
              :model-value="<DrawEnum>getColumnFilter('draw', columnFilters)"
              @update:model-value="columnFilters = setColumnFilter('draw', $event, columnFilters)"
            />
          </div>

          <div class="space-x-3">
            <u-button
              :icon="ui.icons.reload"
              @click="fetchEntries()"
              label="Refresh"
            />

            <u-button
              :icon="ICONS.save"
              label="Save"
              :loading="isSaving"
              :loading-icon="ICONS.uploading"
              @click="handleSave"
            />

            <u-button
              :icon="ICONS.download"
              label="Activity"
              @click="handleScrape()"
              :disabled="entries.every(e => isDefined(e.rank))"
            />
          </div>
        </div>
      </template>

      <u-table
        :data="entries"
        :columns
        :loading="loading"
        v-model:column-filters="columnFilters"
        sticky
        render-fallback-value="—"
      >
        <template #loading>
          <loading-icon />
        </template>

        <template #empty>
          <empty
            :title="`No entry information available for ${selectedEvent.tournament?.name} ${selectedEvent.edition?.year} ${selectedEvent.event?.tour}`"
            @refresh="fetchEntries"
            class="mx-2"
          />
        </template>

        <template #checkbox-header="{ table }">
          <u-checkbox
            :model-value="
              entries.length && Object.keys(updatedEntries).length === table.getFilteredRowModel().rows.length ? true
              : Object.keys(updatedEntries).length ? 'indeterminate'
              : false
            "
            @update:model-value="
              () => {
                if (Object.keys(updatedEntries).length) {
                  updatedEntries = {}
                  updatedMappings = {}
                } else {
                  table.getFilteredRowModel().rows.map(row => {
                    updatedEntries[row.original.entry.entry_id] = {
                      player: row.original.full_name,
                      points: row.original.entry.points,
                      pm: row.original.entry.pm
                    }
                    updatedMappings[row.original.pem_id] = {
                      player: row.original.full_name,
                      rank: row.original.rank
                    }
                  })
                }
              }
            "
            :icon="ICONS.ranking"
          />
        </template>

        <template #checkbox-cell="{ row }">
          <u-checkbox
            :model-value="row.original.entry.entry_id in updatedEntries"
            @update:model-value="
              () => {
                if (row.original.entry.entry_id in updatedEntries) {
                  delete updatedEntries[row.original.entry.entry_id]
                  delete updatedMappings[row.original.pem_id]
                } else {
                  updatedEntries[row.original.entry.entry_id] = {
                    player: row.original.full_name,
                    points: row.original.entry.points,
                    pm: row.original.entry.pm
                  }
                  updatedMappings[row.original.pem_id] = {
                    player: row.original.full_name,
                    rank: row.original.rank
                  }
                }
              }
            "
            :icon="ICONS.ranking"
          />
        </template>

        <template #match_type-cell="{ row }">
          <u-badge
            v-if="row.original.entry.match_type"
            :label="row.original.entry.match_type"
            :color="row.original.entry.match_type"
          />
        </template>

        <template #rank-cell="{ row }">
          <form-input-number
            v-if="row.original.pem_id in updatedMappings"
            v-model="updatedMappings[row.original.pem_id]!.rank"
            placeholder="Rank"
          />

          <div v-else>
            {{ isDefined(row.original.rank) ? row.original.rank.toLocaleString() : "—" }}
          </div>
        </template>

        <template #entry_points-cell="{ row }">
          <form-input-number
            v-if="row.original.entry.entry_id in updatedEntries"
            v-model="updatedEntries[row.original.entry.entry_id]!.points"
            placeholder="Points"
          />

          <div v-else>
            {{ isDefined(row.original.entry.points) ? row.original.entry.points.toLocaleString() : "—" }}
          </div>
        </template>

        <template #entry_pm-cell="{ row }">
          <form-input-number
            v-if="row.original.entry.entry_id in updatedEntries"
            v-model="updatedEntries[row.original.entry.entry_id]!.pm"
            placeholder="Prize Money"
            :currency="selectedEvent.edition?.currency || selectedEvent.event?.currency || 'USD'"
          />

          <div v-else>
            {{
              isDefined(row.original.entry.points) ?
                formatCurrency(row.original.entry.points, selectedEvent.edition?.currency || selectedEvent.event?.currency || "USD")
              : "—"
            }}
          </div>
        </template>
      </u-table>
    </u-card>

    <div class="space-y-6">
      <u-alert
        v-if="errors.length"
        v-for="(error, index) in errors"
        :key="index"
        color="error"
        variant="subtle"
        :title="error.player"
      >
        <template #description>
          {{ prettifyJson(error.details) }}
        </template>
      </u-alert>

      <u-page-card title="Request Body">
        <prose-code class="min-w-0 w-full overflow-x-auto">
          <pre
            class="overflow-x-auto"
            v-html="prettifyJson(updatedEntries)"
          />
        </prose-code>
      </u-page-card>
    </div>
  </div>
</template>
