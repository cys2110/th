<script setup lang="ts">
definePageMeta({ name: "results" })

const {
  params: { id, edId }
} = useRoute("results")

const {
  ui: { icons }
} = useAppConfig()

const toast = useToast()

const supabase = useSupabaseClient()

const viewModeStore = useViewModeStore()
const tournamentStore = useTournamentStore()

// const players = ref<string[]>([])
// const tour = ref<keyof typeof tourEnum>()
// const draw = ref<DrawEnumType>()
// const matchType = ref<MatchTypeEnumType>()

// const resetFilters = () => {
//   players.value = []
//   tour.value = undefined
//   draw.value = undefined
// }

const {
  data: matches,
  pending,
  refresh
} = await useAsyncData(
  "results",
  async () => {
    const { data: eventsData, error: eventsError } = await supabase.from("events").select("id").eq("edition_id", Number(edId))

    if (eventsError || !eventsData) {
      console.error("Error fetching events:", eventsError)
      return
    }
    const { data, error } = await supabase
      .from("matches")
      .select(
        `
      *,
      rounds!inner(*),
      people(*),
      winner:winner_id(
        player_entry_mapping(countries(*), players(id, first_name, last_name)),
        entry_status(status, draw),
        seeds(seed, draw)
      ),
      loser:loser_id(
        player_entry_mapping(countries(*), players(id, first_name, last_name)),
        entry_status(status, draw),
        seeds(seed, draw)
      )
    `
      )
      .in(
        "rounds.event_id",
        eventsData.map(e => e.id)
      )
      .neq("incomplete", "B")

    if (error || !data) {
      console.error("Error fetching matches:", error)
      return
    }

    return data
  },
  { default: () => [] }
)

// const playerOptions = computed(() => {
//   const uniqueWinners = matches.value.map(m => m.winner.team).flat()

//   const uniqueLosers = matches.value.map(m => m.loser.team).flat()

//   const uniquePlayers = [...uniqueWinners, ...uniqueLosers].sort((a, b) => {
//     if (a.last_name === b.last_name) {
//       return a.first_name!.localeCompare(b.first_name!)
//     }
//     return a.last_name!.localeCompare(b.last_name!)
//   })

//   return useArrayUnique(
//     uniquePlayers.map(p => ({
//       label: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
//       value: p.id
//     })),
//     (a, b) => a.value === b.value
//   ).value
// })

// const tableRef = useTemplateRef("tableRef")
</script>

<template>
  <u-container class="max-w-7xl">
    <u-page>
      <!-- <template v-if="tableRef?.table">
            <table-client-clear-filters :table="tableRef.table" />

            <table-client-clear-sorting :table="tableRef.table" />

            <table-client-clear-grouping :table="tableRef.table" />

            <table-client-visibility :table="tableRef.table" />
          </template>

          <template v-else>
            <u-button
              @click="resetFilters"
              :icon="ICONS.filterOff"
              label="Reset filters"
              block
            />

            <u-form-field label="Filter by">
              <div class="*:my-2">
                <u-input-menu
                  v-model="players"
                  value-key="value"
                  label-key="label"
                  placeholder="Select players"
                  multiple
                  :icon="ICONS.player"
                  :items="playerOptions"
                />

                <u-radio-group
                  v-if="tournamentStore.tours.length > 1"
                  legend="Tour"
                  v-model="tour"
                  :items="tournamentStore.tours"
                />

                <filters-draw-type
                  v-if="matches.some(match => match.draw === 'Qualifying')"
                  v-model="draw"
                />

                <filters-match-type
                  v-if="matches.some(match => match.type === 'Singles') && matches.some(match => match.type === 'Doubles')"
                  v-model="matchType"
                />
              </div>
            </u-form-field>
          </template> -->

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
