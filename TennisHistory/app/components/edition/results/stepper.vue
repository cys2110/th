<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"

const props = defineProps<{
  matches: ResultMatchType[]
  status: AsyncDataRequestStatus
  refresh: () => void
  players: string[]
  tour?: keyof typeof tourEnum
  type?: MatchTypeEnumType
  draw?: DrawEnumType
}>()

const {
  params: { id, year }
} = useRoute("results")

const tournamentStore = useTournamentStore()

const consolidatedMatches = computed(() => {
  const consolidatedData = []

  const rounds = useArrayUnique(props.matches.map(m => m.round))

  for (const round of rounds.value) {
    const roundMatches = props.matches.filter(m => {
      const isRoundMatch = m.round === round
      const isTourMatch = !props.tour || m.tour === props.tour
      const isTypeMatch = !props.type || m.type === props.type
      const isDrawMatch = !props.draw || m.draw === props.draw
      return isRoundMatch && isTourMatch && isTypeMatch && isDrawMatch
    })
    consolidatedData.push({ title: round, matches: roundMatches })
  }
  return consolidatedData
})

const filteredMatches = computed(() => {
  return props.matches.filter(m => {
    const isPlayerMatch =
      props.players.length === 0 || m.winner.team.some(p => props.players.includes(p.id)) || m.loser.team.some(p => props.players.includes(p.id))
    const isTourMatch = !props.tour || m.tour === props.tour
    const isTypeMatch = !props.type || m.type === props.type
    const isDrawMatch = !props.draw || m.draw === props.draw
    return isTourMatch && isTypeMatch && isDrawMatch && isPlayerMatch
  })
})
</script>

<template>
  <u-stepper
    v-if="consolidatedMatches.length && players.length === 0"
    :items="consolidatedMatches"
    :linear="false"
  >
    <template #indicator="{ item }">
      {{ roundEnum[item.title as keyof typeof roundEnum] }}
    </template>

    <template #content="{ item }">
      <u-page-columns>
        <edition-results-card
          v-for="match in item.matches"
          :key="match.id"
          :match
        />
      </u-page-columns>
    </template>
  </u-stepper>

  <u-page-columns v-else-if="filteredMatches.length || status === 'pending'">
    <edition-results-card
      v-if="filteredMatches.length"
      v-for="match in filteredMatches"
      :key="match.id"
      :match
    />
    <edition-results-loading
      v-else
      v-for="_ in 6"
      :key="_"
    />
  </u-page-columns>

  <empty
    v-else
    :message="`No matches played in ${tournamentStore.name} ${year}`"
  >
    <dev-only>
      <match-country-update
        v-if="COUNTRY_DRAWS.includes(id)"
        :refresh
      />
      <match-update
        v-else
        :refresh
      />
    </dev-only>
  </empty>
</template>
