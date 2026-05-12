<script setup lang="ts">
const props = defineProps<{
  tour: TourType
  matchType: MatchEnumType
  draw: DrawType
}>()

const {
  params: { edId }
} = useRoute("draws")

const {
  ui: { icons }
} = useAppConfig()

const supabase = useSupabaseClient()

const key = computed(() => `${edId}-${JSON.stringify(props)}`)

const { data, pending } = await useAsyncData<DrawData>(
  key,
  async () => {
    // rounds
    const { data: roundsData, error: roundsError } = await supabase
      .from("rounds")
      .select(
        `
        round,
        number,
        matches(*, people(*))
        events!inner(edition_id)
      `
      )
      .eq("events.edition_id", Number(edId))
      .eq("tour", props.tour)
      .eq("match_type", props.matchType)
      .eq("draw", props.draw)

    if (roundsError || !roundsData) {
      console.error("Error fetching rounds")

      return {
        rounds: [],
        matches: [],
        entries: {}
      } as DrawData
    }

    // entries
    const { data: entriesData, error: entriesError } = await supabase
      .from("entries")
      .select(
        `
        id,
        player_entry_mapping(countries(*), players(id, first_name, last_name)),
        seeds(seed, draw),
        entry_status(status, draw),
        events(edition_id),
        matches!inner(id)
      `
      )
      .eq("events.edition_id", Number(edId))
      .eq("events.tour", props.tour)
      .eq("match_type", props.matchType)
      .eq("matches.draw", props.draw)

    if (entriesData || !entriesError) {
      console.error("Error fetching rounds")

      return {
        rounds: [],
        matches: [],
        entries: {}
      } as DrawData
    }

    return {
      rounds: [],
      matches: [],
      entries: {}
    } as DrawData
  },
  { default: () => ({ rounds: [], matches: [], entries: {} }) as DrawData }
)
</script>

<template>
  <div> Component: draws/index </div>
</template>
