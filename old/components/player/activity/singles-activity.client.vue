<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"

const { matches, tournament, id, year, tour } = defineProps<{
  matches: MatchInterface[]
  year: string
  id: number
  tournament: TournamentInterface
  tour: TourType
}>()
const {
  ui: { icons }
} = useAppConfig()
const { params } = useRoute()
const { id: playerId, name: playerName } = params as { id: string; name: string }

const columns: TableColumn<MatchInterface>[] = [
  { accessorKey: "round", header: "Round" },
  { id: "opponent", header: "Opponent" },
  { accessorKey: "opponent.rank", header: "Rank" },
  { accessorKey: "winner_id", header: "" },
  { id: "score", header: "Score" },
  { id: "h2h", header: "" }
]
</script>

<template>
  <u-table
    :data="matches"
    :columns
  >
    <template #opponent-cell="{ row }">
      <div
        v-if="row.original.opponent"
        class="flex items-center gap-2"
      >
        <player-link :player="row.original.opponent" />
        <span
          v-if="
            (!row.original.round.includes('Qualifying') && (row.original.opponent?.seed || row.original.opponent?.status)) ||
            (row.original.round.includes('Qualifying') && (row.original.opponent?.q_seed || row.original.opponent?.q_status))
          "
          class="text-xs"
        >
          ({{
            row.original.round.includes("Qualifying") ?
              `${row.original.opponent.q_seed ?? ""}${row.original.opponent.q_status && row.original.opponent.q_seed ? " " : ""}${row.original.opponent.q_status ?? ""}`
            : `${row.original.opponent.seed ?? ""}${row.original.opponent.status && row.original.opponent.seed ? " " : ""}${row.original.opponent.status ?? ""}`
          }})
        </span>
      </div>
      <template v-else>BYE</template>
    </template>

    <template #winner_id-cell="{ row }">
      <u-icon
        :name="row.original.winner_id === playerId ? icons.success : icons.error"
        :class="`text-xl ${row.original.winner_id === playerId ? 'text-success-600' : 'text-error-600'}`"
      />
    </template>

    <template #score-cell="{ row }">
      <template v-if="row.original.incomplete === 'B'">—</template>
      <match-score-item
        v-else
        :labels="row.original.labels"
        :sets="row.original.sets"
        :tournament
        :id
        :year
        :match_no="row.original.match_no"
        :incomplete="row.original.incomplete"
        :centred="true"
        :stats="row.original.stats"
      />
    </template>

    <template #h2h-cell="{ row }">
      <u-button
        v-if="row.original.opponent"
        size="sm"
        variant="subtle"
        :to="{
          name: 'h2h-players',
          params: {
            p1Name: playerName,
            p2Name: kebabCase(row.original.opponent.first_name || ' ' || row.original.opponent.last_name),
            p1Id: playerId,
            p2Id: row.original.opponent.id
          }
        }"
      >
        H2H
      </u-button>
    </template>
  </u-table>
</template>
