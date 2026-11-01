<script setup lang="ts">
const props = defineProps<{ item: DrawOption }>()

const { ui } = useAppConfig()

const route = useRoute("draws")
const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()
const editionId = computed(() => tournamentStore.ids.edition)

const { data: matches } = await useAsyncData(
  () => `matches-${editionId.value}-${JSON.stringify(props.item)}`,
  async () => {
    if (editionId.value) {
      const { data, error } = await supabase
        .schema("tennis")
        .from("rounds")
        .select(
          `
          round,
          number,
          events!inner(edition_id),
          matches(
            *,
            ...people(umpire:full_name),
            scores:match_scores(*),
            match_stats(count)
          )
    `
        )
        .eq("events.edition_id", editionId.value)
        .eq("tour", props.item.tour)
        .eq("draw", props.item.draw)
        .eq("match_type", props.item.match_type)
        .not("round", "in", '("Round robin","Group stage","Alternate","Participation","Win","Qualifier")')
        .order("number", { ascending: false })

      console.log(data)

      return data
    }
  },
  { default: () => [], server: false }
)
</script>

<template>
  <div> Component: edition/draws/index </div>
</template>
