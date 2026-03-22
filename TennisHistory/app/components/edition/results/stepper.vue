<script setup lang="ts">
const props = defineProps<{
  matches: ResultsMatchInterface[]
  pending: boolean
}>()

const {
  params: { year }
} = useRoute("results")

const tournamentStore = useTournamentStore()

const selectedTour = ref<TourType[]>([])
const selectedMatchType = ref<MatchEnumType[]>([])

const filteredMatches = computed(() =>
  props.matches.filter(m => {
    const isTourMatch = !selectedTour.value.length || (m.tour && selectedTour.value.includes(m.tour))
    const isTypeMatch = !selectedMatchType.value.length || selectedMatchType.value.includes(m.match_type)

    return isTourMatch && isTypeMatch
  })
)

const consolidatedMatches = computed<EditionResultStepperItemInterface[]>(() => {
  const rounds = useArrayUnique(filteredMatches.value.sort((a, b) => b.rounds.number - a.rounds.number).map(m => m.rounds.round)).value

  return rounds.map(round => ({
    title: round,
    matches: filteredMatches.value
      .filter(m => m.rounds.round === round)
      .map(
        m =>
          ({
            id: m.id,
            court: m.court,
            date: m.date,
            tour: m.tour,
            match_type: m.match_type,
            format: m.format,
            incomplete: m.incomplete,
            duration: m.duration,
            umpire:
              m.people ?
                {
                  first_name: m.people.first_name,
                  last_name: m.people.last_name
                }
              : null,
            stats: m.match_stats[0]!.count > 0,
            winner: {
              id: m.winner.id,
              status: m.winner.entry_status.find(s => s.draw === m.draw)?.status,
              seed: m.winner.seeds.find(s => s.draw === m.draw)?.seed,
              team: m.winner.player_entry_mapping.map(pem => ({
                id: pem.players.id,
                first_name: pem.players.first_name,
                last_name: pem.players.last_name,
                country: pem.countries,
                rank: pem.rank
              }))
            },
            loser: {
              id: m.loser.id,
              status: m.loser.entry_status.find(s => s.draw === m.draw)?.status,
              seed: m.loser.seeds.find(s => s.draw === m.draw)?.seed,
              team: m.loser.player_entry_mapping.map(pem => ({
                id: pem.players.id,
                first_name: pem.players.first_name,
                last_name: pem.players.last_name,
                country: pem.countries,
                rank: pem.rank
              }))
            },
            scores: m.match_scores
          }) as EditionResultMatchInterface
      )
  }))
})
</script>

<template>
  <div class="flex justify-end gap-5">
    <u-form-field
      label="Tour"
      size="lg"
    >
      <u-checkbox-group
        v-model="selectedTour"
        :items="tournamentStore.tours"
        :icon="ICONS.tour"
        orientation="horizontal"
      />
    </u-form-field>

    <u-form-field
      label="S/D"
      size="lg"
    >
      <u-checkbox-group
        v-model="selectedMatchType"
        :items="[...MATCH_TYPES]"
        :icon="ICONS.people"
        orientation="horizontal"
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
        <u-page-columns class="p-5">
          <edition-results-card
            v-for="match in item.matches"
            :key="match.id"
            :match
          />
        </u-page-columns>
      </template>
    </u-stepper>
    <empty
      v-else
      :message="`No matches played in ${tournamentStore.name} ${year}`"
    />
  </div>
</template>
