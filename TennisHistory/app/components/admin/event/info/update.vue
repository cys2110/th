<script setup lang="ts">
import { ICONS, isDefined, prettifyJson, STATUS_MAPPING } from "#imports"
import type { TableColumn } from "@nuxt/ui"
import { type ColumnFiltersState } from "@tanstack/vue-table"
import { textSpanIsEmpty } from "typescript"
import type { TablesUpdate } from "~/types/database.types"

type Relationship = "defaults" | "ldas" | "entry_status" | "retirements" | "walkovers" | "withdrawals"

interface EntryInfoInterface {
  info_type: Relationship
  id: number
  draw: DrawEnum
  status: StatusEnum | null
  rank: number | null
  reason: string | null
  team: string
  teammate: { id: string; full_name: string } | null
  players: Array<{ id: string; full_name: string }>
}

type UpdatedEntryInfo = {
  [key in Relationship]: {
    [key: string]: any
  }
}

const selectedEvent = defineModel<EventSelection>({ default: () => ({}) })

const supabase = useSupabaseClient()
const toast = useToast()
const { ui } = useAppConfig()

const initialState: UpdatedEntryInfo = {
  defaults: {},
  ldas: {},
  entry_status: {},
  retirements: {},
  walkovers: {},
  withdrawals: {}
}

const entryInfo = ref<Array<EntryInfoInterface>>([])
const loading = ref(false)
const updatedInfo = ref<UpdatedEntryInfo>({ ...initialState })
const isSaving = ref(false)
const errors = ref<Array<{ id: string; team: string; info_type: Relationship; details: any }>>([])

const fetchInfo = async () => {
  if (!selectedEvent.value.event?.id) return
  set(loading, true)

  const { data, error } = await supabase
    .schema("tennis")
    .from("entry_info")
    .select("*")
    .eq("tournament_id", selectedEvent.value.tournament!.id)
    .eq("year", selectedEvent.value.edition?.year)
    .eq("edition_no", selectedEvent.value.edition?.edition_no)
    .eq("tour", selectedEvent.value.event.tour)
    .order("info_type", { ascending: true })
    .order("draw", { ascending: true })

  if (error || !data) {
    console.error("Error fetching entryInfo", error)
    toast.add({
      title: "Error fetching entryInfo",
      description: JSON.stringify(error)
    })
  }

  const parsedData = data!.map(d => {
    return {
      info_type: d.info_type as Relationship,
      id: d.id as number,
      draw: d.draw!,
      status: d.status,
      rank: d.rank,
      reason: d.reason,
      team: (d.team as any[]).map(t => t.full_name).join(" / ") as string,
      teammate:
        d.player_id && d.teammate ?
          {
            id: d.player_id,
            full_name: d.teammate
          }
        : null,
      players: (d.team as any[]).map(t => ({
        id: t.id,
        full_name: t.full_name
      }))
    }
  })

  set(entryInfo, parsedData)
  set(loading, false)
}

defineExpose({ fetchInfo })

watch(
  () => selectedEvent.value.event?.id,
  async () => {
    if (selectedEvent.value.event?.id) {
      await fetchInfo()
    }
  },
  { immediate: true }
)

const columns: Array<TableColumn<EntryInfoInterface>> = [
  { id: "checkbox" },
  { accessorKey: "info_type", header: "Type" },
  { accessorKey: "draw", header: "Draw" },
  { accessorKey: "team", header: "Team" },
  {
    id: "details",
    accessorFn: row => {
      switch (row.info_type) {
        case "entry_status":
          return row.status
        case "ldas":
          return row.rank
        default:
          return row.reason
      }
    },
    header: "Details"
  },
  { accessorKey: "teammate", header: "Player" },
  { id: "delete" }
]

const columnFilters = ref<ColumnFiltersState>([])

const handleSave = async () => {
  set(isSaving, true)

  const failedUpdates: UpdatedEntryInfo = { ...initialState }

  const tennis = supabase.schema("tennis")

  for (const info_type of Object.keys(updatedInfo.value) as Relationship[]) {
    const entries: Record<string, any> = updatedInfo.value[info_type]
    for (const [infoId, value] of Object.entries(entries)) {
      if (info_type === "ldas") {
        const { error: ldaError } = await tennis.from("ldas").update({ rank: value.rank }).eq("id", parseInt(infoId))

        if (ldaError) {
          errors.value.push({
            id: infoId,
            team: value.team,
            info_type: "ldas",
            details: ldaError
          })

          failedUpdates[info_type][infoId] = value
        }
      } else if (info_type === "entry_status") {
        const { error: statusError } = await tennis.from("entry_status").update({ status: value.status }).eq("id", parseInt(infoId))

        if (statusError) {
          errors.value.push({
            id: infoId,
            team: value.team,
            info_type: "entry_status",
            details: statusError
          })

          failedUpdates[info_type][infoId] = value
        }
      } else {
        const { error: withdrawalError } = await tennis
          .from(info_type)
          .update({ reason: value.reason, player_id: value.player_id })
          .eq("id", parseInt(infoId))

        if (withdrawalError) {
          errors.value.push({
            id: infoId,
            team: value.team,
            info_type,
            details: withdrawalError
          })

          failedUpdates[info_type][infoId] = value
        }
      }
    }
  }
  set(updatedInfo, failedUpdates)

  set(isSaving, false)
  await fetchInfo()
}

const handleDelete = async (id: number, type: Relationship) => {
  const { error } = await supabase.schema("tennis").from(type).delete().eq("id", id)

  if (error) {
    console.error("Error deleting entry info", error)
    toast.add({
      title: "Error deleting entry info",
      icon: ui.icons.error,
      color: "error"
    })
  }

  if (id in updatedInfo.value[type]) {
    delete updatedInfo.value[type][id]
  }

  await fetchInfo()

  toast.add({
    title: "Entry info successfully removed",
    icon: ui.icons.success,
    color: "success"
  })
}
</script>

<template>
  <div class="grid grid-cols-3 gap-6 items-start">
    <u-card class="col-span-2">
      <template #header>
        <div class="flex justify-end">
          <div class="space-x-3">
            <u-button
              :icon="ui.icons.reload"
              @click="fetchInfo()"
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
        :data="entryInfo"
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
            @refresh="fetchInfo"
            class="mx-2"
          />
        </template>

        <template #checkbox-header="{ table }">
          <u-checkbox
            :model-value="
              table.getFilteredRowModel().rows.length > 0 &&
              table.getFilteredRowModel().rows.every(row => row.original.id in updatedInfo[row.original.info_type]) ? true
              : table.getFilteredRowModel().rows.some(row => row.original.id in updatedInfo[row.original.info_type]) ? 'indeterminate'
              : false
            "
            @update:model-value="
              checked => {
                for (const { original: row } of table.getFilteredRowModel().rows) {
                  if (checked === true) {
                    updatedInfo[row.info_type][row.id] ??= {
                      team: row.team,
                      reason: row.reason,
                      rank: row.rank,
                      status: row.status,
                      player_id: row.teammate?.id
                    }
                  } else {
                    delete updatedInfo[row.info_type][row.id]
                  }
                }
              }
            "
            :icon="ui.icons.info"
          />
        </template>

        <template #checkbox-cell="{ row }">
          <u-checkbox
            :model-value="row.original.id in updatedInfo[row.original.info_type]"
            @update:model-value="
              () => {
                if (row.original.id in updatedInfo[row.original.info_type]) {
                  delete updatedInfo[row.original.info_type][row.original.id]
                } else {
                  updatedInfo[row.original.info_type][row.original.id] = {
                    team: row.original.team,
                    reason: row.original.reason,
                    rank: row.original.rank,
                    status: row.original.status,
                    player_id: row.original.teammate?.id
                  }
                }
              }
            "
            :icon="ICONS.ranking"
          />
        </template>

        <template #details-cell="{ row }">
          <template v-if="row.original.id in updatedInfo[row.original.info_type]">
            <form-input-number
              v-if="row.original.info_type === 'ldas'"
              v-model="updatedInfo[row.original.info_type][row.original.id].rank"
              placeholder="Rank"
            />

            <u-input-menu
              v-else-if="row.original.info_type === 'entry_status'"
              v-model="updatedInfo[row.original.info_type][row.original.id].status"
              :items="Object.entries(STATUS_MAPPING).map(([value, label]) => ({ label, value }))"
              value-key="value"
              clear
              placeholder="Status"
            />

            <form-input
              v-else
              v-model="updatedInfo[row.original.info_type][row.original.id].reason"
              placeholder="Reason"
            />
          </template>

          <template v-else>
            <div v-if="isDefined(row.original.rank)">{{ row.original.rank }}</div>

            <div v-else-if="row.original.status">{{ STATUS_MAPPING[row.original.status] }}</div>

            <div v-else-if="row.original.reason">
              {{ row.original.reason }}
            </div>
          </template>
        </template>

        <template #teammate-cell="{ row }">
          <u-input-menu
            v-if="row.original.id in updatedInfo[row.original.info_type] && row.original.players.length > 1"
            v-model="updatedInfo[row.original.info_type][row.original.id].player_id"
            :items="row.original.players"
            value-key="id"
            label-key="full_name"
            clear
          />

          <div v-else>{{ row.original.teammate?.full_name }}</div>
        </template>

        <template #delete-cell="{ row }">
          <u-button
            :icon="ui.icons.close"
            @click="handleDelete()"
            color="error"
          />
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
            v-html="prettifyJson(updatedInfo)"
          />
        </prose-code>
      </u-page-card>
    </div>
  </div>
</template>
