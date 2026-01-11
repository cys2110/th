<script setup lang="ts">
const {
  params: { edId }
} = useRoute("edition")
const tournamentStore = useTournamentStore()

const {
  data: awards,
  status,
  refresh
} = await useFetch("/api/edition/awards", {
  query: { edId },
  default: () => [],
  onResponseError: ({ error }) => console.error("Error fetching edition awards:", error)
})

export type ConsolidatedRound = {
  round: string
  currency: CurrencyEnumType | null
  singles: Record<keyof typeof tourEnum, { pm: number | null; points: number | null }>
  doubles: Record<keyof typeof tourEnum, { pm: number | null; points: number | null }>
}

const consolidatedRounds = computed<ConsolidatedRound[]>(() => {
  const uniqueRounds = useArrayUnique(awards.value.map(a => a.round)).value

  return uniqueRounds.map(round => {
    const roundAwards = awards.value.filter(a => a.round === round)

    const singles = roundAwards.filter(a => a.type === "Singles")
    const doubles = roundAwards.filter(a => a.type === "Doubles")

    const emptyAward = { pm: null, points: null }

    const roundData: ConsolidatedRound = {
      round,
      singles: Object.fromEntries(tournamentStore.tours.map(tour => [tour, { ...emptyAward }])) as ConsolidatedRound["singles"],
      doubles: Object.fromEntries(tournamentStore.tours.map(tour => [tour, { ...emptyAward }])) as ConsolidatedRound["doubles"],
      currency: singles[0]?.currency ?? doubles[0]?.currency ?? null
    }

    for (const tour of tournamentStore.tours) {
      const singlesAward = singles.find(a => a.tour === tour)
      const doublesAward = doubles.find(a => a.tour === tour)

      roundData.singles[tour] = {
        pm: singlesAward?.pm ?? null,
        points: singlesAward?.points ?? null
      }

      roundData.doubles[tour] = {
        pm: doublesAward?.pm ?? null,
        points: doublesAward?.points ?? null
      }
    }

    return roundData
  })
})

const columnPinning = ref({
  left: ["round"],
  right: []
})

const getRound = (round: RoundEnumType, type: MatchTypeEnumType, tour: keyof typeof tourEnum) => {
  return awards.value.find(a => a.round === round && a.type === type && a.tour === tour)
}
</script>

<template>
  <dashboard-subpanel
    title="Awards"
    :icon="ICONS.awards"
  >
    <template #right>
      <dev-only>
        <edition-awards-update
          :refresh
          icon-only
        />
      </dev-only>

      <edition-awards-chart
        :awards
        :status
      />
    </template>

    <u-table
      :data="consolidatedRounds"
      :columns="awardsColumns(getRound, refresh)"
      :loading="status === 'pending'"
      sticky
      render-fallback-value="—"
      v-model:column-pinning="columnPinning"
      :ui="{ th: 'py-1 text-center', td: 'text-center' }"
    >
      <template #loading>
        <loading-icon />
      </template>
      <template #empty>
        <empty
          message="No awards found"
          :icon="ICONS.awardsOff"
        >
          <dev-only>
            <edition-awards-update :refresh />
          </dev-only>
        </empty>
      </template>
    </u-table>
  </dashboard-subpanel>
</template>
