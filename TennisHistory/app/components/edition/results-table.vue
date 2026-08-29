<script setup lang="ts">
import { ICONS } from "#imports"
import type { TableColumn, TableRow } from "@nuxt/ui"
import { isDefined } from "@vueuse/core"

const props = defineProps<{
  matches: Array<ResultMatchQuery>
  pending: boolean
}>()

const emits = defineEmits<{ refresh: [] }>()

const route = useRoute("results")
const router = useRouter()
const { ui } = useAppConfig()
const toast = useToast()

const { isAdmin } = useAuthState()
const tournamentStore = useTournamentStore()

const columns = computed<Array<TableColumn<ResultMatchQuery>>>(() => [
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

const handleSelectRow = (_e: Event, row: TableRow<ResultMatchQuery>) => {
  if (row.original.match_stats[0]?.count || isAdmin.value) {
    router.push({
      name: "match",
      params: { id: row.original.id || "" }
    })
  }
}
</script>

<template>
  <u-table
    :data="matches"
    :columns
    :loading="pending"
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

    <template #winner-cell="{ row }">
      <div
        v-if="row.original.winner"
        class="flex items-center gap-1.5"
      >
        <player-link :team="row.original.winner.team" />

        <small v-if="row.original.winner_seed || row.original.winner_status">
          ({{ row.original.winner_seed }}{{ row.original.winner_seed && row.original.winner_status ? " " : "" }}{{ row.original.winner_status }})
        </small>

        <small>[{{ row.original.winner_rank }}]</small>
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

        <small>[{{ row.original.loser_rank }}]</small>
      </div>
    </template>

    <template #score-cell="{ row }">
      <div class="flex items-center gap-1">
        <div
          v-for="(set, index) in row.original.winner_scores"
          :key="index"
        >
          <span>{{ (set as any).set }}{{ (row.original.loser_scores as any)[index].set }}</span>
          <sup v-if="isDefined((set as any).tb) || isDefined((row.original.loser_scores as any)[index].tb)">
            {{ Math.min((set as any).tb || 9999, (row.original.loser_scores as any)[index].tb || 9999) }}
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
</template>
