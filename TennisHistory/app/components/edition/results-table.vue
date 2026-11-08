<script setup lang="ts">
import { formatDate, getColumnFilter, isDefined, setColumnFilter } from "#imports"
import type { TableColumn, TableRow } from "@nuxt/ui"
import type { ColumnFiltersState } from "@tanstack/vue-table"

const props = defineProps<{
  matches: Array<ResultMatchQuery>
  pending: boolean
}>()

const emits = defineEmits<{ refresh: [] }>()

const route = useRoute("results")

const { isAdmin } = useAuthState()
const tournamentStore = useTournamentStore()

const multipleTours = computed(() => new Set(props.matches.map(m => m.tour)).size > 1)
const rounds = computed(() => useArrayUnique(props.matches.map(m => m.round)).value)

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

      <template #date-cell="{ row }">
        {{ row.original.date ? formatDate(row.original.date) : "—" }}
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
