<script setup lang="ts">
import { getColumnFilter, ICONS, setColumnFilter } from "#imports"
import type { TableColumn, TableRow } from "@nuxt/ui"
import { isDefined, set, useArrayUnique } from "@vueuse/core"
import { parseDate } from "@internationalized/date"
import type { ColumnFiltersState } from "@tanstack/vue-table"

interface UpdatedMatches {
  [key: string]: {
    date: any
    court: string | null
    umpire: {
      id: string
      full_name: string
      icon: string
    }
    duration: string | null
  }
}

const props = defineProps<{
  matches: Array<ResultMatchQuery>
  pending: boolean
}>()

const emits = defineEmits<{ refresh: [] }>()

const route = useRoute("results")
const { ui } = useAppConfig()
const toast = useToast()
const supabase = useSupabaseClient()

const { isAdmin } = useAuthState()
const tournamentStore = useTournamentStore()

const multipleTours = computed(() => new Set(props.matches.map(m => m.tour)).size > 1)
const rounds = computed(() => useArrayUnique(props.matches.map(m => m.round)).value)
const updatedMatches = ref<UpdatedMatches>({})
const isSaving = ref(false)

const columns = computed<Array<TableColumn<ResultMatchQuery>>>(() => [
  { id: "checkbox" },
  { accessorKey: "tour", header: "Tour" },
  { accessorKey: "match_type", header: "S/D" },
  { accessorKey: "round", header: "Round" },
  { accessorKey: "date", header: "Date" },
  { accessorKey: "court", header: "Court" },
  { accessorKey: "umpire.full_name", header: "Umpire" },
  { accessorKey: "duration", header: "Duration" },
  { id: "winner", header: "Winner", meta: { class: { th: "text-left" } } },
  { id: "loser", header: "Loser", meta: { class: { th: "text-left" } } },
  { id: "score", header: "Score", meta: { class: { th: "text-left" } } },
  { id: "actions" }
])

const columnFilters = ref<ColumnFiltersState>([])

const columnVisibility = computed(() => ({
  checkbox: isAdmin.value,
  tour: multipleTours.value
}))

const handleSelectRow = async (_e: Event, row: TableRow<ResultMatchQuery>) => {
  if (row.original.match_stats?.[0]?.count || isAdmin.value) {
    await navigateTo(
      {
        name: "match",
        params: { id: row.original.id || "" }
      },
      {
        open: {
          target: "_blank"
        }
      }
    )
  }
}

const handleSave = async () => {
  set(isSaving, true)

  const errors: UpdatedMatches = {}

  for (const [id, match] of Object.entries(updatedMatches.value)) {
    const { date, umpire, ...rest } = match

    const { error } = await supabase
      .schema("tennis")
      .from("matches")
      .update({ ...rest, date: date?.toString() || null, umpire_id: umpire?.id || null })
      .eq("id", id)

    if (error) {
      console.error("Error updated match", id, error)
      errors[id] = match
    }
  }

  const hasErrors = Object.keys(errors).length > 0

  toast.add({
    title: hasErrors ? "Error updating matches" : "Matches successfully updated",
    icon: ui.icons[hasErrors ? "error" : "success"],
    color: hasErrors ? "error" : "success"
  })

  emits("refresh")
  set(updatedMatches, errors)
  set(isSaving, false)
}
</script>

<template>
  <u-container class="my-6 space-y-6">
    <div class="flex justify-end gap-3">
      <u-select-menu
        v-if="multipleTours"
        :items="tournamentStore.tours"
        label-key="tour"
        value-key="tour"
        placeholder="Tour"
        clear
        :model-value="<TourEnum>getColumnFilter('tour', columnFilters)"
        @update:model-value="columnFilters = setColumnFilter('tour', $event, columnFilters)"
      />

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

      <u-select-menu
        :items="rounds"
        placeholder="Round"
        clear
        :model-value="<string>getColumnFilter('round', columnFilters)"
        @update:model-value="columnFilters = setColumnFilter('round', $event, columnFilters)"
      />

      <u-field-group v-if="isAdmin">
        <u-button
          :icon="ui.icons.reload"
          @click="$emit('refresh')"
        />

        <u-button
          :icon="ICONS.save"
          @click="handleSave"
          :loading="isSaving"
        />
      </u-field-group>
    </div>

    <u-table
      :data="matches"
      :columns
      :loading="pending"
      v-model:column-filters="columnFilters"
      v-model:column-visibility="columnVisibility"
      sticky
      render-fallback-value="—"
      @select="handleSelectRow"
    >
      <template #loading>
        <loading-icon />
      </template>

      <template #empty>
        <empty :title="`No matches have been played for ${tournamentStore.name} ${route.params.year}`" />
      </template>

      <template #checkbox-header="{ table }">
        <u-checkbox
          :model-value="
            Object.keys(updatedMatches).length === table.getFilteredRowModel().rows.length ? true
            : Object.keys(updatedMatches).length ? 'indeterminate'
            : false
          "
          @update:model-value="
            () => {
              if (Object.keys(updatedMatches).length) {
                updatedMatches = {}
              } else {
                table.getFilteredRowModel().rows.map(
                  row =>
                    (updatedMatches[row.original.id!] = {
                      date: row.original.date ? parseDate(row.original.date) : undefined,
                      court: row.original.court,
                      duration: row.original.duration,
                      umpire: {
                        id: row.original.umpire_id || '',
                        full_name: row.original.umpire?.full_name || '',
                        icon: ''
                      }
                    })
                )
              }
            }
          "
          :icon="ICONS.racquet"
        />
      </template>

      <template #checkbox-cell="{ row }">
        <u-checkbox
          :model-value="row.original.id && row.original.id in updatedMatches"
          @update:model-value="
            () => {
              if (row.original.id && row.original.id in updatedMatches) {
                delete updatedMatches[row.original.id!]
              } else {
                updatedMatches[row.original.id!] = {
                  date: row.original.date ? parseDate(row.original.date) : undefined,
                  court: row.original.court,
                  duration: row.original.duration,
                  umpire: {
                    id: row.original.umpire_id || '',
                    full_name: row.original.umpire?.full_name || '',
                    icon: ''
                  }
                }
              }
            }
          "
          :icon="ICONS.racquet"
        />
      </template>

      <template #date-cell="{ row }">
        <div
          v-if="row.original.id && row.original.id in updatedMatches"
          @click.stop
          @keydown.stop
        >
          <u-input-date
            v-model="updatedMatches[row.original.id!]!.date"
            locale="en-GB"
          />
        </div>

        <div v-else>{{ row.original.date }}</div>
      </template>

      <template #court-cell="{ row }">
        <div
          v-if="row.original.id && row.original.id in updatedMatches"
          @click.stop
          @keydown.stop
        >
          <form-input
            v-model="updatedMatches[row.original.id!]!.court"
            placeholder="Court"
          />
        </div>

        <div v-else>{{ row.original.court }}</div>
      </template>

      <template #duration-cell="{ row }">
        <div
          v-if="row.original.id && row.original.id in updatedMatches"
          @click.stop
          @keydown.stop
        >
          <form-input
            v-model="updatedMatches[row.original.id]!.duration"
            placeholder="HH:MM:SS"
          />
        </div>

        <div v-else>{{ row.original.duration }}</div>
      </template>

      <template #umpire_full_name-cell="{ row }">
        <div
          v-if="row.original.id && row.original.id in updatedMatches"
          @click.stop
          @keydown.stop
        >
          <person-search
            v-model="updatedMatches[row.original.id]!.umpire"
            placeholder="Select umpire"
          />
        </div>

        <div v-else>{{ row.original.umpire ? row.original.umpire?.full_name : "" }}</div>
      </template>

      <template #winner-cell="{ row }">
        <div
          v-if="row.original.winner"
          class="flex items-center gap-1.5"
        >
          <player-link :team="row.original.winner.team" />

          <small v-if="row.original.winner_seed || row.original.winner_status">
            ({{ row.original.winner_seed }}{{ row.original.winner_seed && row.original.winner_status ? " " : "" }}{{ row.original.winner_status }})
          </small>

          <small>[{{ row.original.winner.team.reduce((total, player) => total + (player.rank || 0), 0) }}]</small>
        </div>
      </template>

      <template #loser-cell="{ row }">
        <div
          v-if="row.original.loser"
          class="flex items-center gap-1.5"
        >
          <player-link :team="row.original.loser.team" />

          <small v-if="row.original.loser_seed || row.original.loser_status">
            ({{ row.original.loser_seed }}{{ row.original.loser_seed && row.original.loser_status ? " " : "" }}{{ row.original.loser_status }})
          </small>

          <small>[{{ row.original.loser.team.reduce((total, player) => total + (player.rank || 0), 0) }}]</small>
        </div>
      </template>

      <template #score-cell="{ row }">
        <div class="flex items-center gap-1">
          <!-- <span>{{ row.original.winner_scores ? row.original.winner_scores.length : "" }}</span>
        <div>{{ row.original.loser_scores ? row.original.loser_scores.length : "" }}</div> -->
          <div
            v-for="(set, index) in row.original.winner_scores"
            :key="index"
          >
            <span>{{ (set as any).set }}{{ (row.original.loser_scores as any)[index]?.set }}</span>
            <sup v-if="isDefined((set as any)?.tb) || isDefined((row.original.loser_scores as any)[index]?.tb)">
              {{ Math.min((set as any)?.tb || 9999, (row.original.loser_scores as any)[index]?.tb || 9999) }}
            </sup>
          </div>

          <u-badge
            v-if="row.original.incomplete"
            :label="row.original.incomplete"
            color="error"
          />
        </div>
      </template>

      <template #actions-cell="{ row }">
        <!-- <u-button label="H2H" :icon="ICONS.h2h" :to="{ name: 'head-to-head'}" /> -->
      </template>
    </u-table>
  </u-container>
</template>
