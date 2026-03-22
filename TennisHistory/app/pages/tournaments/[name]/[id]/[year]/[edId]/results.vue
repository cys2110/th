<script setup lang="ts">
definePageMeta({ name: "results" })

const {
  params: { id, edId }
} = useRoute("results")

const supabase = useSupabaseClient()

const viewModeStore = useViewModeStore()

const {
  data: matches,
  pending,
  refresh
} = await useAsyncData<ResultsMatchInterface[]>(
  "results",
  async () => {
    const { data: eventsData, error: eventsError } = await supabase.from("events").select("id").eq("edition_id", Number(edId))

    if (eventsError || !eventsData) {
      console.error("Error fetching events:", eventsError)
      return []
    }

    console.log(eventsData)

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

    if (error || !data) {
      console.error("Error fetching matches:", error)
      return []
    }

    return data as unknown as ResultsMatchInterface[]
  },
  { default: () => [] }
)
</script>

<template>
  <u-container class="mx-3">
    <u-page>
      <edition-wrapper>
        <template #header-links>
          <dev-only>
            <match-country-create
              v-if="COUNTRY_DRAWS.includes(id)"
              @refresh="refresh"
            />

            <match-create
              v-else
              @refresh="refresh"
            />
          </dev-only>
        </template>
      </edition-wrapper>

      <u-page-body>
        <edition-results-table
          v-if="viewModeStore.isTableView"
          :matches
          :pending
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
