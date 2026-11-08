<script setup lang="ts">
import { getColumnFilter, ICONS, isDefined, prettifyJson, setColumnFilter } from "#imports"
import type { TableColumn } from "@nuxt/ui"
import type { ColumnFiltersState } from "@tanstack/vue-table"

interface Seed {
  id: number
  team: string
  seed: number
  rank: number | null
  draw: DrawEnum
  match_type: MatchTypeEnum
}

interface UpdatedSeed {
  [key: string]: {
    team: string
    rank: number | null
  }
}

const selectedEvent = defineModel<EventSelection>({ default: () => ({}) })

const supabase = useSupabaseClient()
const toast = useToast()
const { ui } = useAppConfig()

const seeds = ref<Array<Seed>>([])
const loading = ref(false)
const updatedSeeds = ref<UpdatedSeed>({})
const isSaving = ref(false)
const errors = ref<Array<{ id: string; team: string; details: any }>>([])

const fetchSeeds = async () => {
  if (!selectedEvent.value.event?.id) return
  set(loading, true)

  const { data, error } = await supabase
    .schema("tennis")
    .from("seeds")
    .select(
      `
      id,
      seed,
      draw,
      match_type,
      rank,
      entry:entries(
        player_entry_mapping(
          player_order,
          ...player(...people(full_name))
        )
      )
`
    )
    .eq("event_id", selectedEvent.value.event?.id)
    .order("match_type", { ascending: true })
    .order("draw", { ascending: true })
    .order("seed", { ascending: true })

  if (error || !data) {
    console.error("Error fetching seeds", error)
    toast.add({
      title: "Error fetching seeds",
      description: JSON.stringify(error)
    })
  }

  const parsedData = data!.map(seed => {
    const { entry, ...rest } = seed

    const players = entry.player_entry_mapping.sort((a, b) => a.player_order - b.player_order)

    return {
      ...rest,
      team: players.map(p => p.full_name).join(" / ")
    }
  })

  set(seeds, parsedData)
  set(loading, false)
}

defineExpose({ fetchSeeds })

watch(
  () => selectedEvent.value.event?.id,
  async () => {
    if (selectedEvent.value.event?.id) {
      await fetchSeeds()
    }
  },
  { immediate: true }
)

const columns: Array<TableColumn<Seed>> = [
  { id: "checkbox" },
  { accessorKey: "match_type", header: "S/D" },
  { accessorKey: "draw", header: "Draw" },
  { accessorKey: "seed", header: "Seed" },
  { accessorKey: "team", header: "Team" },
  { accessorKey: "rank", header: "Rank" }
]

const columnFilters = ref<ColumnFiltersState>([])

const handleSave = async () => {
  set(isSaving, true)

  const failedUpdates: UpdatedSeed = {}

  for (const [seedId, value] of Object.entries(updatedSeeds.value)) {
    const { error } = await supabase.schema("tennis").from("seeds").update({ rank: value.rank }).eq("id", parseInt(seedId))

    if (error) {
      errors.value.push({
        id: seedId,
        team: value.team,
        details: error
      })
      failedUpdates[seedId] = value
    }
  }
  set(updatedSeeds, failedUpdates)

  set(isSaving, false)
  await fetchSeeds()
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
              @click="fetchSeeds()"
              label="Refresh"
            />

            <u-button
              :icon="ICONS.save"
              label="Save"
              :loading="isSaving"
              :loading-icon="ICONS.uploading"
              @click="handleSave"
            />
          </div>
        </div>
      </template>

      <u-table
        :data="seeds"
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
            :title="`No seed information available for ${selectedEvent.tournament?.name} ${selectedEvent.edition?.year} ${selectedEvent.event?.tour}`"
            @refresh="fetchSeeds"
            class="mx-2"
          />
        </template>

        <template #checkbox-header="{ table }">
          <u-checkbox
            :model-value="
              seeds.length && Object.keys(updatedSeeds).length === table.getFilteredRowModel().rows.length ? true
              : Object.keys(updatedSeeds).length ? 'indeterminate'
              : false
            "
            @update:model-value="
              () => {
                if (Object.keys(updatedSeeds).length) {
                  updatedSeeds = {}
                } else {
                  table.getFilteredRowModel().rows.map(
                    row =>
                      (updatedSeeds[row.original.id!] = {
                        team: row.original.team,
                        rank: row.original.rank
                      })
                  )
                }
              }
            "
            :icon="ICONS.ranking"
          />
        </template>

        <template #checkbox-cell="{ row }">
          <u-checkbox
            :model-value="row.original.id in updatedSeeds"
            @update:model-value="
              () => {
                if (row.original.id in updatedSeeds) {
                  delete updatedSeeds[row.original.id!]
                } else {
                  updatedSeeds[row.original.id] = {
                    team: row.original.team,
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
            v-if="row.original.match_type"
            :label="row.original.match_type"
            :color="row.original.match_type"
          />
        </template>

        <template #rank-cell="{ row }">
          <form-input-number
            v-if="row.original.id! in updatedSeeds"
            v-model="updatedSeeds[row.original.id]!.rank"
            placeholder="Rank"
          />

          <div v-else>
            {{ isDefined(row.original.rank) ? row.original.rank.toLocaleString() : "—" }}
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
        :title="error.team"
      >
        <template #description>
          {{ prettifyJson(error.details) }}
        </template>
      </u-alert>

      <u-page-card title="Request Body">
        <prose-code class="min-w-0 w-full overflow-x-auto">
          <pre
            class="overflow-x-auto"
            v-html="prettifyJson(updatedSeeds)"
          />
        </prose-code>
      </u-page-card>
    </div>
  </div>
</template>
