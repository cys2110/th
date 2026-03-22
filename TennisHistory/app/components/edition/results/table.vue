<script setup lang="ts">
import { UBadge } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import { createColumnHelper, getFacetedRowModel, getFacetedUniqueValues } from "@tanstack/vue-table"

const props = defineProps<{
  matches: ResultsMatchInterface[]
  pending: boolean
}>()

const router = useRouter()

const { dev } = useRuntimeConfig().public

const tournamentStore = useTournamentStore()

const {
  params: { id, name, edId, year }
} = useRoute("results")

const parsedMatches = computed(() =>
  props.matches.map(m => ({
    id: m.id,
    match_no: m.match_no,
    court: m.court,
    date: m.date,
    tour: m.tour,
    match_type: m.match_type,
    draw: m.draw,
    format: m.format,
    incomplete: m.incomplete,
    duration: m.duration,
    round: m.rounds.round,
    umpire:
      m.people ?
        {
          first_name: m.people.first_name,
          last_name: m.people.last_name
        }
      : null,
    stats: m.match_stats[0]!.count > 0,
    winner: {
      id: m.winner.id,
      status: m.winner.entry_status.find(s => s.draw === m.draw)?.status,
      seed: m.winner.seeds.find(s => s.draw === m.draw)?.seed,
      team: m.winner.player_entry_mapping.map(pem => ({
        id: pem.players.id,
        first_name: pem.players.first_name,
        last_name: pem.players.last_name,
        country: pem.countries,
        rank: pem.rank
      }))
    },
    loser: {
      id: m.loser.id,
      status: m.loser.entry_status.find(s => s.draw === m.draw)?.status,
      seed: m.loser.seeds.find(s => s.draw === m.draw)?.seed,
      team: m.loser.player_entry_mapping.map(pem => ({
        id: pem.players.id,
        first_name: pem.players.first_name,
        last_name: pem.players.last_name,
        country: pem.countries,
        rank: pem.rank
      }))
    },
    scores: m.match_scores
  }))
)

type ResultTableType = (typeof parsedMatches.value)[number]

const columnHelper = createColumnHelper<ResultTableType>()

const columns: TableColumn<ResultTableType>[] = [
  { accessorKey: "tour" },
  { accessorKey: "match_type" },
  { accessorKey: "round" },
  {
    accessorKey: "date",
    sortingFn: (rowA, rowB, columnId) => {
      const valueA = rowA.getValue(columnId)
      const valueB = rowB.getValue(columnId)

      if (!valueA) return 1
      if (!valueB) return -1

      return (valueA as string).localeCompare(valueB as string)
    }
  },
  {
    accessorKey: "duration",
    sortingFn: (rowA, rowB, columnId) => {
      const valueA = rowA.getValue(columnId)
      const valueB = rowB.getValue(columnId)

      if (!valueA || valueA === "00:00:00") return 1
      if (!valueB || valueB === "00:00:00") return -1

      return (valueA as string).localeCompare(valueB as string)
    }
  },
  { accessorKey: "court" },
  { id: "umpire", accessorFn: row => (row.umpire ? `${row.umpire.last_name}, ${row.umpire.first_name}` : undefined) },
  columnHelper.group({
    id: "Winner",
    header: () => h(UBadge, { label: "Winner", color: "success", class: "w-full" }),
    columns: [
      {
        id: "winner_team",
        accessorFn: row => row.winner.team.map(p => `${p.last_name}, ${p.first_name}`).join(" / ")
      },
      {
        id: "winner_status",
        accessorFn: row => {
          const { seed, status } = row.winner

          const value = []

          if (seed) value.push(String(seed))
          if (status) value.push(status)

          return value.join(" ")
        },
        header: "Seed/Status"
      },
      {
        id: "winner_rank",
        accessorFn: row => row.winner.team.reduce((acc, player) => acc + (player.rank ?? 0), 0),
        header: "Rank",
        sortingFn: (rowA, rowB, columnId) => {
          const valueA = rowA.getValue(columnId)
          const valueB = rowB.getValue(columnId)

          if (valueA === undefined || valueA === 0) return 1
          if (valueB === undefined || valueB === 0) return -1

          return (valueA as number) - (valueB as number)
        }
      }
    ]
  }),
  columnHelper.group({
    id: "Loser",
    header: () => h(UBadge, { label: "Loser", color: "warning", class: "w-full" }),
    columns: [
      {
        id: "loser_team",
        accessorFn: row => row.loser.team.map(p => `${p.last_name}, ${p.first_name}`).join(" / ")
      },
      {
        id: "loser_status",
        accessorFn: row => {
          const { seed, status } = row.loser

          const value = []

          if (seed) value.push(String(seed))
          if (status) value.push(status)

          return value.join(" ")
        },
        header: "Seed/Status"
      },
      {
        id: "loser_rank",
        accessorFn: row => row.loser.team.reduce((acc, player) => acc + (player.rank ?? 0), 0),
        header: "Rank",
        sortingFn: (rowA, rowB, columnId) => {
          const valueA = rowA.getValue(columnId)
          const valueB = rowB.getValue(columnId)

          if (valueA === undefined || valueA === 0) return 1
          if (valueB === undefined || valueB === 0) return -1

          return (valueA as number) - (valueB as number)
        }
      }
    ]
  }),
  { id: "score", header: "Score" },
  { id: "h2h" }
]

const handleSelectRow = (_e: Event, row: TableRow<ResultTableType>) => {
  if (dev || row.original.stats) {
    router.push({
      name: "match",
      params: {
        id,
        name,
        edId,
        year,
        mid: row.original.id
      }
    })
  }
}
</script>

<template>
  <u-table
    :data="parsedMatches"
    :columns
    :loading="pending"
    sticky
    render-fallback-value="—"
    @select="handleSelectRow"
    :faceted-options="{
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues()
    }"
    :meta="{
      class: {
        tr: (row: TableRow<ResultTableType>) =>
          dev && !row.original.stats ? 'bg-warning/20 cursor-pointer'
          : row.original.stats ? 'cursor-pointer'
          : ''
      }
    }"
  >
    <template #loading>
      <loading-icon />
    </template>

    <template #empty>
      <empty :message="`No matches played in ${tournamentStore.name} ${year}`" />
    </template>

    <template #tour-header="{ column }">
      <table-client-filter-header
        :column
        label="Tour"
        :icon="ICONS.tour"
      />
    </template>

    <template #tour-cell="{ row }">
      <u-badge
        v-if="row.original.tour"
        :label="row.original.tour"
        :color="row.original.tour"
      />
    </template>

    <template #match_type-header="{ column }">
      <table-client-filter-header
        :column
        label="S/D"
        :icon="ICONS.people"
      />
    </template>

    <template #match_type-cell="{ row }">
      <u-badge
        :label="row.original.match_type"
        :color="row.original.match_type"
      />
    </template>

    <template #round-header="{ column }">
      <table-client-filter-header
        :column
        label="Round"
        :icon="ICONS.level"
      />
    </template>

    <template #date-header="{ column }">
      <table-client-sort-header
        :column
        label="Date"
        :icon="ICONS.calendar"
      />
    </template>

    <template #duration-header="{ column }">
      <table-client-sort-header
        :column
        label="Duration"
        :icon="ICONS.timer"
      />
    </template>

    <template #court-header="{ column }">
      <div class="flex justify-center items-center gap-0.5">
        <table-client-filter-header
          :column
          label="Court"
          :icon="ICONS.court"
        />
        <table-client-sort-header :column />
      </div>
    </template>

    <template #umpire-header="{ column }">
      <div class="flex justify-center items-center gap-0.5">
        <table-client-name-filter-header
          :column
          label="Umpire"
          :icon="ICONS.umpire"
        />
        <table-client-sort-header :column />
      </div>
    </template>

    <template #umpire-cell="{ row }">
      <div v-if="row.original.umpire">{{ row.original.umpire.first_name }} {{ row.original.umpire.last_name }}</div>
    </template>

    <template #winner_team-header="{ column }">
      <div class="flex justify-center items-center gap-0.5">
        <table-client-name-filter-header
          :column
          label="Winner"
          :icon="ICONS.trophy"
        />
        <table-client-sort-header :column />
      </div>
    </template>

    <template #winner_team-cell="{ row }">
      <player-link
        v-for="player in row.original.winner.team"
        :key="player.id"
        :player="player"
      />
    </template>

    <template #loser_team-header="{ column }">
      <div class="flex justify-center items-center gap-0.5">
        <table-client-name-filter-header
          :column
          label="Winner"
          :icon="ICONS.trophy"
        />
        <table-client-sort-header :column />
      </div>
    </template>

    <template #loser_team-cell="{ row }">
      <player-link
        v-for="player in row.original.loser.team"
        :key="player.id"
        :player="player"
      />
    </template>

    <template #score-cell="{ row }">
      <div class="flex justify-center items-center gap-1">
        <template
          v-for="set_no in Array.from({ length: row.original.format }, (_, i) => 1 + i)"
          :key="set_no"
        >
          <div v-if="row.original.scores.some(s => s.set_no === set_no)">
            <span>{{ row.original.scores.find(s => s.set_no === set_no && s.entry_id === row.original.winner.id)?.set }}</span>
            <span>{{ row.original.scores.find(s => s.set_no === set_no && s.entry_id === row.original.loser.id)?.set }}</span>
            <sup v-if="row.original.scores.find(s => s.set_no === set_no && isDefined(s.tb))">{{
              Math.min(...row.original.scores.filter(s => s.set_no === set_no).map(s => s.tb || 0))
            }}</sup>
          </div>
        </template>

        <u-badge
          v-if="row.original.incomplete"
          :label="row.original.incomplete"
          color="error"
        />
      </div>
    </template>

    <template #h2h-cell="{ row }">
      <u-button
        label="H2H"
        :icon="ICONS.h2h"
        :to="{
          name: 'h2h-players',
          params: {
            t1Name: row.original.winner.team.map(player => kebabCase(`${player.first_name} ${player.last_name}`)).join('+'),
            t2Name: row.original.loser.team.map(player => kebabCase(`${player.first_name} ${player.last_name}`)).join('+'),
            t1Id: row.original.winner.team.map(player => player.id).join('+'),
            t2Id: row.original.loser.team.map(player => player.id).join('+')
          }
        }"
      />
    </template>
  </u-table>
</template>
