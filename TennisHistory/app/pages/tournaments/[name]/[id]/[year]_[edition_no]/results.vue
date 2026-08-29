<script setup lang="ts">
definePageMeta({ name: "results" })

const route = useRoute("results")
const supabase = useSupabaseClient()

const view = ref<"card" | "table">("table")

const {
  data: matches,
  pending,
  refresh
} = await useAsyncData(
  () => `${JSON.stringify(route.params)}-results`,
  async () => {
    const { data: eventsData, error: eventsError } = await supabase
      .schema("tennis")
      .from("events")
      .select("id, edition:editions!inner(id, year, tournament_id)")
      .eq("editions.year", Number(route.params.year))
      .eq("editions.tournament_id", route.params.id)

    if (eventsError || !eventsData) {
      console.error("Error fetching events:", eventsError)
      return []
    }

    const { data, error } = await fetchResultMatches(supabase, route.params.id, route.params.year, route.params.edition_no)

    if (error || !data) {
      console.error("Error fetching matches:", error)
      return []
    }

    return data
  },
  { default: () => [] }
)
</script>

<template>
  <u-container>
    <u-page>
      <edition-wrapper />

      <u-page-body>
        <edition-results-table
          v-if="view === 'table'"
          :matches
          :pending
          @refresh="refresh"
        />

        <edition-results-stepper
          v-else
          :matches
          :pending
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
