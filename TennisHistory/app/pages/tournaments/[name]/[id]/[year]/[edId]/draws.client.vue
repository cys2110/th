<script setup lang="ts">
definePageMeta({ name: "draws" })

const route = useRoute("draws")

const edId = computed(() => route.params.edId)

const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()

const matchTypeOptions = ref<Array<MatchEnumType>>([])
const drawOptions = ref<Array<DrawType>>([])

const selectedTour = ref<TourType | undefined>()
const selectedMatchType = ref<MatchEnumType>("Singles")
const selectedDraw = ref<DrawType>("Main")

watch(
  () => tournamentStore.tours,
  () => {
    if (tournamentStore.tours.length) {
      selectedTour.value = tournamentStore.tours[0]
    }
  },
  { immediate: true }
)

const { data: events } = await useAsyncData(
  () => `draw-options-${edId.value}`,
  async () => {
    if (!edId.value) {
      return []
    }

    const { data, error } = await supabase
      .from("events")
      .select("id, tour, s_draw, s_link, d_draw, d_link, qs_draw, qs_link, qd_draw, qd_link, editions(draw_link, draw_type)")
      .eq("edition_id", Number(edId.value))

    if (error || !data) {
      console.error("Error fetching draw options", error)
      return []
    }

    return data
  },
  { default: () => [], watch: [edId], server: false }
)

watch(
  events,
  () => {
    if (events.value.length) {
      if (events.value.some(event => event.qs_draw)) {
        set(drawOptions, ["Main", "Qualifying"])
      }

      let matchTypes: Array<MatchEnumType> = []

      if (events.value.some(event => event.s_draw)) {
        matchTypes.push("Singles")
      }

      if (events.value.some(event => event.d_draw)) {
        matchTypes.push("Doubles")
      }

      if (matchTypes.length) {
        set(matchTypeOptions, matchTypes)
        set(selectedMatchType, matchTypes[0])
      }
    }
  },
  { immediate: true }
)

const selectedDrawType = computed(() => {
  if (events.value[0]?.editions?.draw_type) {
    return events.value[0].editions.draw_type
  }

  const selectedTourEvent = events.value.find(event => event.tour === selectedTour.value)

  if (selectedTourEvent) {
    if (selectedDraw.value === "Main") {
      if (selectedMatchType.value === "Singles") {
        return selectedTourEvent.s_draw
      } else {
        return selectedTourEvent.d_draw
      }
    } else if (selectedDraw.value === "Qualifying") {
      if (selectedMatchType.value === "Singles") {
        return selectedTourEvent.qs_draw
      } else {
        return selectedTourEvent.qd_draw
      }
    }
  }
})

const pdfLink = computed(() => {
  if (events.value[0]?.editions?.draw_link) {
    return events.value[0].editions.draw_link
  }

  const selectedTourEvent = events.value.find(event => event.tour === selectedTour.value)

  if (selectedTourEvent) {
    if (selectedDraw.value === "Main") {
      if (selectedMatchType.value === "Singles") {
        return selectedTourEvent.s_link
      } else {
        return selectedTourEvent.d_link
      }
    } else if (selectedDraw.value === "Qualifying") {
      if (selectedMatchType.value === "Singles") {
        return selectedTourEvent.qs_link
      } else {
        return selectedTourEvent.qd_link
      }
    }
  }
})
</script>

<template>
  <u-container>
    <u-page>
      <edition-wrapper />

      <u-page-body>
        <div class="flex justify-end items-center gap-5">
          <u-form-field
            v-if="tournamentStore.tours.length > 1"
            label="Tour"
          >
            <u-radio-group
              v-model="selectedTour"
              :items="tournamentStore.tours"
              orientation="horizontal"
              highlight
            />
          </u-form-field>

          <u-form-field
            v-if="matchTypeOptions.length > 1"
            label="S/D"
          >
            <u-radio-group
              v-model="selectedMatchType"
              :items="matchTypeOptions"
              orientation="horizontal"
              highlight
            />
          </u-form-field>

          <u-form-field
            v-if="drawOptions.length > 1"
            label="Draw"
          >
            <u-radio-group
              v-model="selectedDraw"
              :items="drawOptions"
              orientation="horizontal"
              highlight
            />
          </u-form-field>

          <u-button
            v-if="pdfLink"
            :icon="ICONS.pdf"
            :href="pdfLink"
            target="_blank"
          />
        </div>

        <div class="max-h-[calc(100vh-20rem)] overflow-y-auto">
          <draws-lc v-if="route.params.id === '9210'" />

          <draws-country v-else-if="COUNTRY_DRAWS.includes(route.params.id)" />

          <draws
            v-else
            :tour="selectedTour!"
            :match-type="selectedMatchType"
            :draw="selectedDraw"
          />

          <draws-round-robin
            v-if="selectedTour && selectedDrawType === 'Round robin'"
            :tour="selectedTour"
            :match-type="selectedMatchType"
            :draw="selectedDraw"
          />
        </div>
      </u-page-body>
    </u-page>
  </u-container>
</template>
