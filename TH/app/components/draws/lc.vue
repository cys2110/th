<script setup lang="ts">
import type { TableColumn, TableRow } from "@nuxt/ui"

interface Round {
  round: RoundType
  label: string
  points: number
  matches: Array<{
    match_no: number
    match_type: MatchEnumType
    winner_id: string
    stats: boolean
    team_1_id: string
    team_2_id: string
    incomplete: IncompleteType | null
    scores: Array<{
      set_no: number
      set: number
      tb: number | null
      team: "t1" | "t2"
    }>
    team_1: Array<{
      rank: number | null
      id: string
      first_name: string
      last_name: string
      country: CountryInterface
    }>
    team_2: Array<{
      rank: number | null
      id: string
      first_name: string
      last_name: string
      country: CountryInterface
    }>
  }>
}

const {
  params: { id, name, edId, year }
} = useRoute("draws")

const {
  ui: { icons }
} = useAppConfig()

const router = useRouter()
const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()

const key = computed(() => `${edId}-lc-matches`)

const {
  data: rounds,
  pending,
  refresh
} = await useAsyncData<Array<Round>>(
  key,
  async () => {
    const { data, error } = (await supabase
      .from("rounds")
      .select(
        `
      round,
      number,
      points,
      matches(
        *,
        team1:team_1_id(player_entry_mapping(countries(*), players(id, first_name, last_name), rank)),
        team2:team_2_id(player_entry_mapping(countries(*), players(id, first_name, last_name), rank)),
        match_scores(*),
        match_stats(*)
      )
    `
      )
      .eq("event_id", `${edId}-LC`)
      .order("number", { ascending: false })
      .order("match_no", { referencedTable: "matches", ascending: true })) as any

    if (error || !data) {
      console.error("Error fetching matches:", error)
      return []
    }

    return data.map((roundData: any) => {
      const { round, matches, points } = roundData

      return {
        round,
        label: formatDate(matches[0]!.date),
        points,
        matches: matches.map((match: any) => {
          const { team1, team2, match_type, winner_id, match_scores, match_stats, team_1_id, team_2_id, match_no, incomplete } = match

          return {
            match_type,
            winner_id,
            match_no,
            team_1_id,
            team_2_id,
            incomplete,
            stats: !!match_stats.length,
            scores: match_scores.map((score: any) => ({
              set_no: score.set_no,
              set: score.set,
              tb: score.tb,
              team: score.entry_id === team_1_id ? "t1" : "t2"
            })),
            team_1: team1.player_entry_mapping.map((player: any) => ({
              rank: player.rank,
              id: player.players.id,
              first_name: player.players.first_name,
              last_name: player.players.last_name,
              country: player.countries
            })),
            team_2: team2.player_entry_mapping.map((player: any) => ({
              rank: player.rank,
              id: player.players.id,
              first_name: player.players.first_name,
              last_name: player.players.last_name,
              country: player.countries
            }))
          }
        })
      }
    })
  },
  { default: () => [] }
)

const columns: Array<TableColumn<Round["matches"][number]>> = [
  { accessorKey: "match_type", header: "S/D" },
  { id: "europe" },
  { id: "world" },
  { id: "score", header: "Score" },
  {
    id: "points",
    header: "Points After Match",
    cell: ({ row }) => {
      const previousMatches = rounds.value.flatMap(r =>
        r.matches
          .filter(match => match.match_no <= row.original.match_no)
          .map(match => ({
            winner: match.winner_id === match.team_1_id ? "Europe" : "World",
            points: r.points
          }))
      )

      const europePoints = previousMatches.reduce((acc, match) => acc + (match.winner === "Europe" ? match.points : 0), 0)
      const worldPoints = previousMatches.reduce((acc, match) => acc + (match.winner === "World" ? match.points : 0), 0)

      return `${europePoints} - ${worldPoints}`
    }
  },
  { id: "h2h" }
]

const handleSelectRow = (_e: Event, row: TableRow<Round["matches"][number]>) => {
  if (row.original.stats) {
    router.push({
      name: "match",
      params: {
        id,
        name,
        year,
        edId,
        tour: "LC",
        match_type: row.original.match_type,
        draw: "Main",
        match_no: row.original.match_no
      }
    })
  }
}
</script>

<template>
  <u-accordion
    v-if="rounds.length"
    :items="rounds"
    type="multiple"
  >
    <template #leading="{ item }">
      <div class="px-2">
        <u-badge
          :label="ROUND_ABBREVIATION_MAPPING[item.round]"
          size="lg"
          class="rounded-full"
        />
      </div>
    </template>

    <template #body="{ item }">
      <u-table
        :data="item.matches"
        :columns
        @select="handleSelectRow"
        :meta="{
          class: {
            tr: row => (row.original.stats ? 'cursor-pointer data-[selectable=true]:hover:bg-elevated/50!' : '')
          }
        }"
      >
        <template #match_type-cell="{ row }">
          <u-badge
            :label="row.original.match_type"
            :color="row.original.match_type"
          />
        </template>

        <template #europe-header>
          <div class="flex items-center w-fit mx-auto gap-2">
            <u-icon :name="ICONS.europe" />
            Team Europe
          </div>
        </template>

        <template #europe-cell="{ row }">
          <players-link
            :players="row.original.team_1"
            class="mx-auto"
          />
        </template>

        <template #world-header>
          <div class="flex items-center w-fit mx-auto gap-2">
            <u-icon :name="ICONS.globe" />
            Team World
          </div>
        </template>

        <template #world-cell="{ row }">
          <players-link
            :players="row.original.team_2"
            class="mx-auto"
          />
        </template>

        <template #score-cell="{ row }">
          <div class="flex justify-center items-center gap-1">
            <div
              v-for="index in Array.from({ length: 3 }, (_, i) => i + 1)"
              :key="index"
            >
              <span>{{ row.original.scores.find(s => s.set_no === index && s.team === "t1")?.set }}</span>
              <span>{{ row.original.scores.find(s => s.set_no === index && s.team === "t2")?.set }}</span>
              <sup v-if="row.original.scores.find(s => s.set_no === index && isDefined(s.tb))">
                {{ Math.min(...row.original.scores.filter(s => s.set_no === index).map(s => s.tb || 0)) }}
              </sup>
            </div>
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
              name: 'head-to-head',
              params: {
                t1_name: row.original.team_1.map(player => kebabCase(`${player.first_name} ${player.last_name}`)).join('+'),
                t2_name: row.original.team_2.map(player => kebabCase(`${player.first_name} ${player.last_name}`)).join('+'),
                t1_id: row.original.team_1.map(player => player.id).join('+'),
                t2_id: row.original.team_2.map(player => player.id).join('+')
              }
            }"
          />
        </template>
      </u-table>
    </template>
  </u-accordion>

  <u-skeleton
    v-else-if="pending"
    class="w-full h-50"
  />

  <u-empty
    v-else
    :title="`No matches played in ${tournamentStore.name} ${year}`"
    description="If you think this is an error, refresh the page. Otherwise, please be patient as we continue to add more data."
    class="mx-2"
  >
    <template #actions>
      <u-button
        label="Refresh"
        :icon="icons.reload"
        @click="refresh()"
      />
    </template>
  </u-empty>
</template>
