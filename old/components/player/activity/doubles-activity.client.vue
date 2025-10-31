<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"

const { matches, tournament, id, year, tour } = defineProps<{
  matches: MatchInterface[]
  year: string
  id: number
  tournament: TournamentInterface
  tour: TourType
  partner: PlayerInterface
}>()
const {
  ui: { icons }
} = useAppConfig()
const { params } = useRoute()
const { id: playerId, name: playerName } = params as { id: string; name: string }

const columns: TableColumn<MatchInterface>[] = [
  { accessorKey: "round", header: "Round" },
  { id: "opponents", header: "Opponents" },
  { accessorKey: "winner_id", header: "" },
  { id: "score", header: "Score" }
]
</script>

<template>
  <u-table
    :data="matches"
    :columns
  >
    <template #opponents-cell="{ row }">
      <div
        v-if="row.original.opponents.length"
        class="flex items-center gap-2"
      >
        <div
          v-for="(opponent, index) in row.original.opponents"
          class="flex items-center gap-2"
        >
          <player-link :player="opponent" />
          <span v-if="opponent.rank">[{{ opponent.rank }}]</span>
          <u-separator
            v-if="index === 0"
            orientation="vertical"
            class="h-4"
            :ui="{ border: 'border-(--ui-text-muted)' }"
          />
        </div>
        <span
          v-if="
            (!row.original.round.includes('Qualifying') && (row.original.opponents?.[0]?.seed || row.original.opponents?.[0]?.status)) ||
            (row.original.round.includes('Qualifying') && (row.original.opponents?.[0]?.q_seed || row.original.opponents?.[0]?.q_status))
          "
          class="text-xs"
        >
          ({{
            row.original.round.includes("Qualifying") ?
              `${row.original.opponents?.[0].q_seed ?? ""}${row.original.opponents?.[0].q_status && row.original.opponents?.[0].q_seed ? " " : ""}${row.original.opponents?.[0].q_status ?? ""}`
            : `${row.original.opponents?.[0].seed ?? ""}${row.original.opponents?.[0].status && row.original.opponents?.[0].seed ? " " : ""}${row.original.opponents?.[0].status ?? ""}`
          }})
        </span>
      </div>
      <template v-else>BYE</template>
    </template>

    <template #winner_id-cell="{ row }">
      <u-icon
        :name="row.original.winner_id === playerId || row.original.winner_id === partner.id ? icons.success : icons.error"
        :class="`text-xl ${row.original.winner_id === playerId || row.original.winner_id === partner.id ? 'text-success-600' : 'text-error-600'}`"
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
  </u-table>
</template>
