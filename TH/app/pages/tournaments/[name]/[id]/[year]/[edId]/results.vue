<script setup lang="ts">
import { curry } from "lodash"

definePageMeta({ name: "results" })

const {
  params: { id, edId }
} = useRoute("results")

const supabase = useSupabaseClient()

const viewModeStore = useViewModeStore()

const key = computed(() => `${edId}-results`)

const {
  data: matches,
  pending,
  refresh
} = await useAsyncData<ResultsMatchInterface[]>(
  key,
  async () => {
    const { data: eventsData, error: eventsError } = await supabase.from("events").select("id").eq("edition_id", Number(edId))

    if (eventsError || !eventsData) {
      console.error("Error fetching events:", eventsError)
      return []
    }

    const { data, error } = await supabase
      .from("matches")
      .select(
        `
      *,
      rounds!inner(*),
      people(*),
      winner:winner_id(
        id,
        player_entry_mapping(rank, countries(*), players(id, first_name, last_name)),
        entry_status(status, draw),
        seeds(seed, draw)
      ),
      loser:loser_id(
        id,
        player_entry_mapping(rank, countries(*), players(id, first_name, last_name)),
        entry_status(status, draw),
        seeds(seed, draw)
      ),
      match_stats(count),
      match_scores(*)
    `
      )
      .in(
        "rounds.event_id",
        eventsData.map(e => e.id)
      )
      .not("loser_id", "is", null)
      .order("tour", { ascending: true })
      .order("match_type", { ascending: true })
      .order("match_no", { ascending: true })

    if (error || !data) {
      console.error("Error fetching matches:", error)
      return []
    }

    return (
      (data as any).map((match: any) => ({
        id: match.id,
        round: {
          number: match.rounds.number,
          round: match.rounds.round
        },
        court: match.court,
        date: match.date,
        tour: match.tour,
        match_type: match.match_type,
        format: match.format,
        incomplete: match.incomplete,
        duration: match.duration,
        umpire: match.people,
        stats: match.match_stats[0]!.count > 0,
        winner: {
          id: match.winner_id,
          status: match.winner.entry_status.find((s: any) => s.draw === match.draw)?.status,
          seed: match.winner.seeds.find((s: any) => s.draw === match.draw)?.seed,
          team: match.winner.player_entry_mapping.map((pem: any) => ({
            ...pem.players,
            country: pem.countries,
            rank: pem.rank
          }))
        },
        loser: {
          id: match.loser_id,
          status: match.loser.entry_status.find((s: any) => s.draw === match.draw)?.status,
          seed: match.loser.seeds.find((s: any) => s.draw === match.draw)?.seed,
          team: match.loser.player_entry_mapping.map((pem: any) => ({
            ...pem.players,
            country: pem.countries,
            rank: pem.rank
          }))
        },
        scores: match.match_scores
      })) as Array<ResultsMatchInterface>
    ).sort((a, b) => {
      const tourComparison = (a.tour || "").localeCompare(b.tour || "")
      if (tourComparison !== 0) return tourComparison

      const matchTypeComparison = b.match_type.localeCompare(a.match_type)
      if (matchTypeComparison !== 0) return matchTypeComparison

      if (a.round.number > b.round.number) {
        return 1
      } else if (a.round.number < b.round.number) {
        return -1
      }

      const aRank = Math.min(
        a.winner.team.reduce((acc, cur) => acc + (cur.rank || 9999), 0),
        a.loser.team.reduce((acc, cur) => acc + (cur.rank || 9999), 0)
      )
      const bRank = Math.min(
        b.winner.team.reduce((acc, cur) => acc + (cur.rank || 9999), 0),
        b.loser.team.reduce((acc, cur) => acc + (cur.rank || 9999), 0)
      )

      return (
        aRank > bRank ? 1
        : aRank < bRank ? -1
        : 0
      )
    })
  },
  { default: () => [] }
)
</script>

<template>
  <u-container>
    <u-page>
      <edition-wrapper />

      <u-page-body>
        <results-table
          v-if="viewModeStore.isTableView"
          :matches
          :pending
          @refresh="refresh"
        />

        <results-stepper
          v-else
          :matches
          :pending
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
