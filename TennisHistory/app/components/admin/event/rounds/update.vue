<script setup lang="ts">
import { formatCurrency, getColumnFilter, ICONS, isDefined, prettifyJson, setColumnFilter } from "#imports"
import type { TableColumn } from "@nuxt/ui"
import type { ColumnFiltersState } from "@tanstack/vue-table"

interface UpdatedRound {
  [key: string]: {
    round: string
    pm: number | null
    points: number | null
  }
}

const selectedEvent = defineModel<EventSelection>({ default: () => ({}) })

const supabase = useSupabaseClient()
const toast = useToast()
const { ui } = useAppConfig()

const rounds = ref<Array<RoundType>>([])
const loading = ref(false)
const updatedRounds = ref<UpdatedRound>({})
const isSaving = ref(false)
const errors = ref<Array<{ id: string; round: string; details: any }>>([])

const fetchRounds = async () => {
  if (!selectedEvent.value.event?.id) return
  set(loading, true)

  const { data, error } = await supabase.schema("tennis").from("rounds").select("*").eq("event_id", selectedEvent.value!.event!.id)

  if (error) {
    console.error("Error fetching rounds", error)
    toast.add({
      title: "Error fetching rounds",
      description: JSON.stringify(error)
    })
  }

  set(rounds, data)
  set(loading, false)
}

defineExpose({ fetchRounds })

watch(
  () => selectedEvent.value.event?.id,
  async () => {
    if (selectedEvent.value.event?.id) {
      await fetchRounds()
    }
  },
  { immediate: true }
)

const columns: Array<TableColumn<RoundType>> = [
  { id: "checkbox" },
  { accessorKey: "match_type", header: "S/D" },
  { accessorKey: "number", header: "Round" },
  { accessorKey: "pm", header: "Prize Money" },
  { accessorKey: "points", header: "Points" }
]

const columnFilters = ref<ColumnFiltersState>([])

const handleSave = async () => {
  set(isSaving, true)

  const failedUpdates: UpdatedRound = {}

  for (const [roundId, value] of Object.entries(updatedRounds.value)) {
    const { error } = await supabase.schema("tennis").from("rounds").update(value).eq("id", roundId)

    if (error) {
      errors.value.push({
        id: roundId,
        round: value.round,
        details: error
      })
      failedUpdates[roundId] = value
    }
  }

  set(updatedRounds, failedUpdates)

  set(isSaving, false)
  await fetchRounds()
}
</script>

<template>
  <div class="grid grid-cols-3 gap-6">
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
              @click="fetchRounds()"
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
        :data="rounds"
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
            :icon="ICONS.moneyOff"
            :title="`No round information available for ${selectedEvent.tournament?.name} ${selectedEvent.edition?.year} ${selectedEvent.event?.tour}`"
            @refresh="fetchRounds"
            class="mx-2"
          />
        </template>

        <template #checkbox-header="{ table }">
          <u-checkbox
            :model-value="
              rounds.length && Object.keys(updatedRounds).length === table.getFilteredRowModel().rows.length ? true
              : Object.keys(updatedRounds).length ? 'indeterminate'
              : false
            "
            @update:model-value="
              () => {
                if (Object.keys(updatedRounds).length) {
                  updatedRounds = {}
                } else {
                  table.getFilteredRowModel().rows.map(
                    row =>
                      (updatedRounds[row.original.id!] = {
                        round: row.original.round,
                        pm: row.original.pm,
                        points: row.original.points
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
            :model-value="row.original.id in updatedRounds"
            @update:model-value="
              () => {
                if (row.original.id in updatedRounds) {
                  delete updatedRounds[row.original.id!]
                } else {
                  updatedRounds[row.original.id] = {
                    round: row.original.round,
                    pm: row.original.pm,
                    points: row.original.points
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

        <template #number-cell="{ row }">
          {{ row.original.round }}
        </template>

        <template #pm-cell="{ row }">
          <form-input-number
            v-if="row.original.id in updatedRounds"
            v-model="updatedRounds[row.original.id]!.pm"
            placeholder="PM"
            :currency="selectedEvent.edition?.currency || selectedEvent.event?.currency || 'USD'"
          />

          <div v-else>
            {{
              isDefined(row.original.pm) ?
                formatCurrency(row.original.pm, selectedEvent.edition?.currency || selectedEvent.event?.currency || "USD")
              : "—"
            }}
          </div>
        </template>

        <template #points-cell="{ row }">
          <form-input-number
            v-if="row.original.id in updatedRounds"
            v-model="updatedRounds[row.original.id]!.points"
            placeholder="Points"
          />

          <div v-else>
            {{ isDefined(row.original.points) ? row.original.points.toLocaleString() : "—" }}
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
        :title="error.round"
      >
        <template #description>
          {{ prettifyJson(error.details) }}
        </template>
      </u-alert>

      <u-page-card title="Request Body">
        <prose-code class="min-w-0 w-full overflow-x-auto">
          <pre
            class="overflow-x-auto"
            v-html="prettifyJson(updatedRounds)"
          />
        </prose-code>
      </u-page-card>
    </div>
  </div>
</template>
