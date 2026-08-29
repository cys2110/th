<script setup lang="ts">
const props = defineProps<{
  tour: TourType
  matchType: MatchEnumType
  draw: DrawType
}>()

const route = useRoute("draws")

const edId = computed(() => route.params.edId)

const supabase = useSupabaseClient()

const { data: groups } = useAsyncData<Array<RoundRobinGroup>>(
  () => `rr-matches-${edId.value}-${JSON.stringify(props)}`,
  async () => {
    if (!edId.value) return []

    let query = supabase
      .from("rounds")
      .select(
        `
        round,
        events!inner(edition_id),
        matches(
          *,
          match_scores(*),
          match_stats(count),
          team1:team_1_id(player_entry_mapping(countries(*), players(id, first_name, last_name, full_name), rank), seeds(*), entry_status(*)),
          team2:team_2_id(player_entry_mapping(countries(*), players(id, first_name, last_name, full_name), rank), seeds(*), entry_status(*))
        )
      `
      )
      .eq("round", "Round robin")
      .eq("events.edition_id", Number(edId.value))

    if (props.matchType) query = query.eq("match_type", props.matchType)
    if (props.tour) query = query.eq("tour", props.tour)
    if (props.draw) query = query.eq("draw", props.draw)

    const { data, error } = await query

    if (error || !data) {
      console.error("Error fetching matches:", error)
      return []
    }

    const matches = data.flatMap(round =>
      round.matches.map(match => ({
        ...match,
        round: round.round
      }))
    )

    const uniqueGroups = useArrayUnique(matches.sort((a, b) => a.match_no - b.match_no).map(m => m.group_name)).value

    return uniqueGroups.map(group => ({
      group: group!,
      matches: matches
        .filter(m => m.group_name === group)
        .map(m => {
          const { match_no, winner_id, team_1_id, team_2_id, incomplete, format, match_stats, match_scores, team1, team2, tour, draw, match_type } = m

          return {
            format,
            match_no,
            winner_id,
            tour,
            draw,
            match_type,
            stats: match_stats[0]!.count > 0,
            team_1_id,
            team_2_id,
            incomplete,
            scores: match_scores,
            team_1: {
              // @ts-expect-error
              seed: team1.seeds.find(s => s.draw === m.draw)?.seed,
              // @ts-expect-error
              status: team1.entry_status.find(s => s.draw === m.draw)?.status,
              // @ts-expect-error
              team: team1.player_entry_mapping.map(player => ({
                rank: player.rank,
                id: player.players.id,
                first_name: player.players.first_name,
                last_name: player.players.last_name,
                full_name: player.players.full_name,
                country: player.countries
              }))
            },
            team_2: {
              // @ts-expect-error
              seed: team2.seeds.find(s => s.draw === m.draw)?.seed,
              // @ts-expect-error
              status: team2.entry_status.find(s => s.draw === m.draw)?.status,
              // @ts-expect-error
              team: team2.player_entry_mapping.map(player => ({
                rank: player.rank,
                id: player.players.id,
                first_name: player.players.first_name,
                last_name: player.players.last_name,
                full_name: player.players.full_name,
                country: player.countries
              }))
            }
          } as RoundRobinMatch
        })
    }))
  },
  { default: () => [], watch: [edId], server: false }
)
</script>

<template>
  <u-page-list class="space-y-3">
    <draws-round-robin-group
      v-for="group in groups"
      :key="group.group"
      :group
    />
  </u-page-list>
</template>
