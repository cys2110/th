<script setup lang="ts">
const props = defineProps<{
  tour: TourType
  matchType: MatchEnumType
  draw: DrawType
}>()

const {
  ui: { icons }
} = useAppConfig()

const route = useRoute("draws")
const edId = computed(() => route.params.edId)

const supabase = useSupabaseClient()

const { data } = await useAsyncData<DrawData>(
  () => `${edId.value}-matches-${props.tour}-${props.matchType}-${props.draw}`,
  async () => {
    let query = supabase
      .from("rounds")
      .select(
        `
        round,
        number,
        events!inner(edition_id),
        matches(
          *,
          people(full_name),
          match_scores(*),
          match_stats(count),
          team1:team_1_id(player_entry_mapping(countries(*), players(id, first_name, last_name, full_name), rank), seeds(*), entry_status(*)),
          team2:team_2_id(player_entry_mapping(countries(*), players(id, first_name, last_name, full_name), rank), seeds(*), entry_status(*))
        )
      `
      )
      .eq("events.edition_id", Number(edId.value))
      .not("round", "in", '("Round robin","Group stage","Alternate","Participation","Win")')
      .order("number", { ascending: false })

    if (props.tour) query = query.eq("tour", props.tour)
    if (props.matchType) query = query.eq("match_type", props.matchType)
    if (props.draw) query = query.eq("draw", props.draw)

    const { data: rounds, error } = await query

    if (error || !rounds) {
      console.error("Error fetching matches", error)
      return {
        rounds: [],
        entries: {}
      }
    }

    const entries = new Map()

    // Fetch entries from first round - first round of tournament has all entries
    for (const match of rounds[0]!.matches) {
      if (match.team_1_id)
        entries.set(match.team_1_id, {
          // @ts-expect-error
          status: match.team1.entry_status.find(s => s.draw === match.draw)?.status,
          // @ts-expect-error
          seed: match.team1.seeds.find(s => s.draw === match.draw)?.seed,
          // @ts-expect-error
          team: match.team1.player_entry_mapping.map(player => ({
            id: player.players.id,
            first_name: player.players.first_name,
            last_name: player.players.last_name,
            full_name: player.players.full_name,
            country: player.countries
          }))
        })

      if (match.team_2_id)
        entries.set(match.team_2_id, {
          // @ts-expect-error
          status: match.team2.entry_status.find(s => s.draw === match.draw)?.status,
          // @ts-expect-error
          seed: match.team2.seeds.find(s => s.draw === match.draw)?.seed,
          // @ts-expect-error
          team: match.team2.player_entry_mapping.map(player => ({
            id: player.players.id,
            first_name: player.players.first_name,
            last_name: player.players.last_name,
            full_name: player.players.full_name,
            country: player.countries
          }))
        })
    }

    return {
      rounds: rounds.map(round => ({
        name: round.round,
        number: round.number,
        matches: round.matches.map(match => ({
          match_no: match.match_no,
          incomplete: match.incomplete,
          date: match.date,
          duration: match.duration,
          court: match.court,
          umpire: match.people?.full_name,
          isBronzeMatch: round.round === "Bronze Medal Match" || round.round === "3rd Place Match",
          sides: [
            {
              entryId: match.team_1_id,
              isWinner: match.team_1_id === match.winner_id,
              scores: match.match_scores
                .filter(s => s.entry_id === match.team_1_id)
                .map(s => ({
                  mainScore: s.set,
                  tiebreak: s.tb,
                  isWinner: s.set! > (match.match_scores.find(s => s.entry_id !== match.team_1_id && s.set_no === s.set_no)?.set || 0)
                }))
            },
            {
              entryId: match.team_2_id,
              isWinner: match.team_2_id === match.winner_id,
              scores: match.match_scores
                .filter(s => s.entry_id === match.team_2_id)
                .map(s => ({
                  mainScore: s.set,
                  tiebreak: s.tb,
                  isWinner: s.set! > (match.match_scores.find(s => s.entry_id !== match.team_2_id && s.set_no === s.set_no)?.set || 0)
                }))
            }
          ]
        }))
      })),
      entries: Object.fromEntries(entries)
    } as DrawData
  },
  {
    default: () => ({
      rounds: [],
      entries: {}
    }),
    watch: [edId],
    server: false
  }
)

const selectedEntryId = ref<string | null>(null)

const handleHighlightPath = (entryId: string | null) => set(selectedEntryId, entryId)

const baseIndexValue = ref(0)
watch(
  () => data.value,
  () => {
    set(baseIndexValue, data.value?.rounds.length > 3 ? 1 : data.value?.rounds.length - 2)
  },
  { immediate: true }
)

const isVisible = (index: number) => index >= baseIndexValue.value - 1 && index <= baseIndexValue.value + 1
</script>

<template>
  <div
    v-if="data"
    class="flex items-center gap-5"
  >
    <u-button
      :icon="icons.chevronLeft"
      @click="baseIndexValue--"
      :disabled="baseIndexValue <= 1"
      block
    />
    <u-button
      :icon="icons.chevronRight"
      @click="baseIndexValue++"
      :disabled="baseIndexValue >= data.rounds.length - 1"
      block
    />
  </div>

  <div
    v-if="data?.rounds.length"
    class="grid grid-cols-[auto_1fr_1fr_auto] grid-rows-[auto_auto_1fr_auto] min-w-65 min-h-62.5 max-w-full w-content h-full text-left"
  >
    <div class="w-0 min-w-full row-1 col-start-1 col-end-5 overflow-hidden pb-px border-b border-muted">
      <div class="grid grid-flow-col auto-cols-fr h-full min-w-full">
        <div
          v-for="(round, index) in data.rounds"
          :key="round.name"
          class="px-5 py-2 flex overflow-hidden justify-center whitespace-nowrap font-medium"
          :class="{ hidden: !isVisible(index) }"
        >
          {{ round.name }}
        </div>
      </div>
    </div>

    <div class="col-start-1 col-end-5 row-2 overflow-x-hidden pointer-events-none max-h-[calc(100vh-23rem)] overflow-y-auto">
      <div class="grid grid-flow-col auto-cols-fr relative z-2 min-w-full min-h-full grid-rows-1 overflow-hidden py-5 px-0">
        <draws-round-column
          v-for="(round, index) in data.rounds"
          :key="index"
          :round-index="index"
          :matches="round.matches"
          :entries="data.entries"
          :selected-entry-id
          :base-index-value
          :handle-highlight-path
        />
      </div>
    </div>
  </div>
</template>
