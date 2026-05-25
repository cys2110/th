<script setup lang="ts">
const props = defineProps<{
  matches: Array<ResultsMatchInterface>
  pending: boolean
}>()

const emits = defineEmits<{ refresh: [] }>()

const {
  params: { year }
} = useRoute("results")

const {
  ui: { icons }
} = useAppConfig()

const tournamentStore = useTournamentStore()

const selectedTour = ref<Array<TourType>>([])
const selectedMatchType = ref<MatchEnumType[]>([])

const filteredMatches = computed(() =>
  props.matches.filter(m => {
    const isTourMatch = !selectedTour.value.length || (m.tour && selectedTour.value.includes(m.tour))
    const isTypeMatch = !selectedMatchType.value.length || selectedMatchType.value.includes(m.match_type)

    return isTourMatch && isTypeMatch
  })
)

const consolidatedMatches = computed(() => {
  const rounds = useArrayUnique(filteredMatches.value.sort((a, b) => b.round.number - a.round.number).map(m => m.round.round)).value

  return rounds.map(round => ({
    title: round,
    matches: filteredMatches.value.filter(m => m.round.round === round)
  }))
})
</script>

<template>
  <div class="flex justify-end gap-5">
    <u-form-field
      v-if="tournamentStore.tours.length > 1"
      label="Tour"
      size="lg"
    >
      <u-checkbox-group
        v-model="selectedTour"
        :items="tournamentStore.tours"
        :icon="ICONS.tour"
        orientation="horizontal"
        size="sm"
        highlight
      />
    </u-form-field>

    <u-form-field
      v-if="matches.some(m => m.match_type === 'Singles') && matches.some(m => m.match_type === 'Doubles')"
      label="S/D"
      size="lg"
    >
      <u-checkbox-group
        v-model="selectedMatchType"
        :items="[...MATCH_TYPES]"
        :icon="ICONS.people"
        orientation="horizontal"
        size="sm"
        highlight
      />
    </u-form-field>
  </div>

  <div class="max-h-[calc(100vh-20%)]">
    <u-stepper
      v-if="consolidatedMatches.length"
      :items="consolidatedMatches"
      :linear="false"
      :default-value="consolidatedMatches.length - 1"
    >
      <template #indicator="{ item }">
        {{ ROUND_ABBREVIATION_MAPPING[item.title] }}
      </template>
      <template #content="{ item }">
        <u-page-grid>
          <results-card
            v-for="match in item.matches"
            :key="match.id"
            :match
          />
        </u-page-grid>
      </template>
    </u-stepper>
    <u-page-grid v-else-if="pending">
      <results-loading-card
        v-for="_ in 6"
        :key="_"
      />
    </u-page-grid>
    <u-empty
      v-else
      :title="`No matches played in ${tournamentStore.name} ${year}`"
      description="If you think this is an error, refresh the page. Otherwise, please be patient as we continue to add more data."
      class="mx-2"
    >
      <template #actions>
        <u-button
          label="Refresh"
          :icon="icons.reload"
          @click="$emit('refresh')"
        />
      </template>
    </u-empty>
  </div>
</template>
