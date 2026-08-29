<script setup lang="ts">
import type { TableColumn, TableRow } from "@nuxt/ui"

interface Round {
  round: RoundType
  label: string
  points: number
  matches: Array<
    Omit<RoundRobinMatch, "scores" | "team_1" | "team_2"> & {
      scores: Array<ConsolidatedScore>
      team_1: Array<Required<BasePlayerType> & { rank: number | null }>
      team_2: Array<Required<BasePlayerType> & { rank: number | null }>
    }
  >
}

const route = useRoute("draws")

const edId = computed(() => route.params.edId)

const {
  ui: { icons }
} = useAppConfig()

const router = useRouter()
const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()

const {
  data: rounds,
  pending,
  refresh
} = await useAsyncData<Array<Round>>(
  () => `lc-matches-${edId.value}`,
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
        team1:team_1_id(player_entry_mapping(countries(*), players(id, first_name, last_name, full_name), rank)),
        team2:team_2_id(player_entry_mapping(countries(*), players(id, first_name, last_name, full_name), rank)),
        scores_by_teams(*),
        match_stats(count)
      )
    `
      )
      .eq("event_id", `${edId.value}-LC`)
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
          const { team1, team2, match_type, winner_id, scores_by_teams, match_stats, team_1_id, team_2_id, match_no, incomplete, tour, draw, id } =
            match

          return {
            id,
            tour,
            draw,
            match_no,
            match_type,
            winner_id,
            team_1_id,
            team_2_id,
            incomplete,
            stats: match_stats[0]?.count > 0,
            scores: scores_by_teams,
            team_1: team1.player_entry_mapping.map((player: any) => ({
              rank: player.rank,
              id: player.players.id,
              first_name: player.players.first_name,
              last_name: player.players.last_name,
              full_name: player.players.full_name,
              country: player.countries
            })),
            team_2: team2.player_entry_mapping.map((player: any) => ({
              rank: player.rank,
              id: player.players.id,
              first_name: player.players.first_name,
              last_name: player.players.last_name,
              full_name: player.players.full_name,
              country: player.countries
            }))
          }
        })
      }
    })
  },
  { default: () => [], watch: [edId], server: false }
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
        ...route.params,
        tour: "LC",
        match_type: row.original.match_type,
        draw: "Main",
        match_id: row.original.id
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
            tr: row => (row.original.stats ? 'data-[selectable=true]:cursor-pointer' : '')
          }
        }"
        :ui="{ tbody: '[&>tr]:even:bg-elevated/25 [&>tr]:data-[selectable=true]:hover:bg-elevated/50' }"
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
          <player-link
            :players="row.original.team_1"
            class="mx-auto"
            :class="{ 'font-semibold': row.original.winner_id === row.original.team_1_id }"
          />
        </template>

        <template #world-header>
          <div class="flex items-center w-fit mx-auto gap-2">
            <u-icon :name="ICONS.globe" />
            Team World
          </div>
        </template>

        <template #world-cell="{ row }">
          <player-link
            :players="row.original.team_2"
            class="mx-auto"
            :class="{ 'font-semibold': row.original.winner_id === row.original.team_2_id }"
          />
        </template>

        <template #score-cell="{ row }">
          <div class="flex justify-center items-center gap-1">
            <short-score
              :format="3"
              :scores="row.original.scores"
            />
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
                t1_name: row.original.team_1.map(player => kebabCase(player.full_name || '—')).join('+'),
                t2_name: row.original.team_2.map(player => kebabCase(player.full_name || '—')).join('+'),
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
    :title="`No matches played in ${tournamentStore.name} ${route.params.year}`"
    description="If you think this is an error, refresh the page. Otherwise, please be patient as we continue to add more data."
    class="m-2"
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
