<script setup lang="ts">
definePageMeta({ name: "draws" })

const {
  params: { id, edId }
} = useRoute("draws")

const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()

const selectedTour = ref<TourType | undefined>(tournamentStore.tours[0])
const selectedMatchType = ref<MatchEnumType>("Singles")
const selectedDraw = ref<DrawType>("Main")

const key = `${edId}-draw-options`

const { data: events } = await useAsyncData(
  key,
  async () => {
    const { data, error } = await supabase
      .from("events")
      .select("id, tour, s_draw, s_link, d_draw, d_link, qs_draw, qs_link, qd_draw, qd_link, editions(draw_link, draw_type)")
      .eq("edition_id", Number(edId))

    if (error || !data) {
      console.error("Error fetching draw options", error)
      // return { draws: [], matchTypes: [] } as DrawOptions
      return []
    }

    return data
  },
  { default: () => [] }
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
      <template #left>
        <u-page-aside>
          <u-form-field
            v-if="tournamentStore.tours.length > 1"
            label="Tour"
          >
            <u-listbox
              v-model="selectedTour"
              :items="tournamentStore.tours.map(t => ({ label: t, value: t }))"
              value-key="value"
            />
          </u-form-field>
          <u-form-field
            v-if="events.some(event => event.s_draw && event.d_draw)"
            label="S/D"
          >
            <u-listbox
              v-model="selectedMatchType"
              :items="MATCH_TYPES.map(t => ({ label: t, value: t }))"
              value-key="value"
            />
          </u-form-field>
          <u-form-field
            v-if="events.some(event => event.qs_draw || event.qd_draw)"
            label="Draw"
          >
            <u-listbox
              v-model="selectedDraw"
              :items="DRAW_TYPES.map(t => ({ label: t, value: t }))"
              value-key="value"
            />
          </u-form-field>
          <u-button
            v-if="pdfLink"
            :icon="ICONS.pdf"
            label="Download PDF"
            block
            :href="pdfLink"
            target="_blank"
          />
        </u-page-aside>
      </template>

      <edition-wrapper />

      <u-page-body>
        <draws-lc v-if="id === '9210'" />

        <draws-country v-else-if="COUNTRY_DRAWS.includes(id)" />

        <!-- <draws
            v-else
            :tour="selectedTour!"
            :match-type="selectedMatchType"
            :draw="selectedDraw"
          /> -->

        <draws-round-robin
          v-if="selectedTour && selectedDrawType === 'Round robin'"
          :tour="selectedTour!"
          :match-type="selectedMatchType"
          :draw="selectedDraw"
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
