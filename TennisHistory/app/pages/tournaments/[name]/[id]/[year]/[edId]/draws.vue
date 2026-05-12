<script setup lang="ts">
definePageMeta({ name: "draws" })

type DrawObject = {
  [key in TourType]?: Partial<Record<MatchEnumType, Partial<Record<DrawType, { type: DrawsType; link: string | null }>>>>
} & {
  draws: Array<DrawType>
  matchTypes: Array<MatchEnumType>
}

type CountryDraw = { edition: { link: string | null; type: DrawsType }; draws: Array<DrawType>; matchTypes: Array<MatchEnumType> }

type DrawOptions = DrawObject | CountryDraw

const {
  params: { edId }
} = useRoute("draws")

const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()

const selectedTour = ref<TourType | undefined>(tournamentStore.tours[0])
const selectedMatchType = ref<MatchEnumType>("Singles")
const selectedDraw = ref<DrawType>("Main")

const isCountryDraw = (item: DrawOptions): item is CountryDraw => {
  return "edition" in item
}

const key = `${edId}-draw-options`

const { data: events } = await useAsyncData<DrawOptions>(
  key,
  async () => {
    const { data, error } = await supabase
      .from("events")
      .select("id, tour, s_draw, s_link, d_draw, d_link, qs_draw, qs_link, qd_draw, qd_link, editions(draw_link, draw_type)")
      .eq("edition_id", Number(edId))

    if (error || !data) {
      console.error("Error fetching draw options", error)
      return { draws: [], matchTypes: [] } as DrawOptions
    }

    if (data[0]?.editions?.draw_type) {
      return { edition: { link: data[0].editions.draw_link, type: data[0].editions.draw_type }, draws: [], matchTypes: [] } as DrawOptions
    }

    const draws = new Set<DrawType>()
    const matchTypes = new Set<MatchEnumType>()
    const drawsObject: Omit<DrawObject, "draws" | "matchTypes"> = {}

    for (const event of data) {
      if (event.tour) {
        drawsObject[event.tour] = {}

        if (event.s_draw) {
          draws.add("Main")
          matchTypes.add("Singles")
          drawsObject[event.tour] = {
            Singles: {
              Main: { type: event.s_draw, link: event.s_link },
              ...(event.qs_draw && { Qualifying: { type: event.qs_draw, link: event.qs_link } })
            }
          }

          if (event.qs_draw) draws.add("Qualifying")
        }

        if (event.d_draw) {
          draws.add("Main")
          matchTypes.add("Doubles")
          drawsObject[event.tour] = {
            ...drawsObject[event.tour],
            Doubles: {
              Main: { type: event.d_draw, link: event.d_link },
              ...(event.qd_draw && { Qualifying: { type: event.qd_draw, link: event.qd_link } })
            }
          }

          if (event.qd_draw) draws.add("Qualifying")
        }
      }
    }

    return {
      ...drawsObject,
      draws: Array.from(draws),
      matchTypes: Array.from(matchTypes)
    } as DrawOptions
  },
  { default: () => ({ draws: [], matchTypes: [] as Array<MatchEnumType> }) }
)

watch(
  () => events.value.matchTypes,
  () => {
    if (!events.value.matchTypes.includes("Singles")) {
      set(selectedMatchType, "Doubles")
    }
  },
  { immediate: true }
)

const selectedDrawOption = computed(() => {
  if (isCountryDraw(events.value)) {
    return events.value.edition
  }

  if (!selectedTour.value) {
    return
  }

  return events.value[selectedTour.value]?.[selectedMatchType.value]?.[selectedDraw.value]
})
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <u-radio-group
            v-if="tournamentStore.tours.length > 1"
            v-model="selectedTour"
            :items="tournamentStore.tours"
            loop
          />

          <u-radio-group
            v-if="events.matchTypes.length > 1"
            v-model="selectedMatchType"
            legend="S/D"
            :items="events.matchTypes"
            loop
            :disabled="
              !selectedTour || isCountryDraw(events) || !events[selectedTour]?.[selectedMatchType === 'Singles' ? 'Doubles' : 'Singles']?.['Main']
            "
          />

          <u-radio-group
            v-if="events.draws.length > 1"
            v-model="selectedDraw"
            legend="Draw"
            :items="events.draws"
            loop
            :disabled="!selectedTour || isCountryDraw(events) || !events[selectedTour]?.[selectedMatchType]?.Qualifying"
          />

          <u-button
            v-if="selectedDrawOption?.link"
            :icon="ICONS.pdf"
            label="Download PDF"
            block
            :href="selectedDrawOption?.link"
            target="_blank"
          />
        </u-page-aside>
      </template>

      <edition-wrapper />

      <u-page-body>
        <draws-country v-if="isCountryDraw(events)" />

        <draws
          v-else
          :tour="selectedTour"
          :match-type="selectedMatchType"
          :draw="selectedDraw"
        />

        <draws-round-robin
          v-if="selectedDrawOption?.type === 'Round robin'"
          :tour="selectedTour"
          :match-type="selectedMatchType"
          :draw="selectedDraw"
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
