<script setup lang="ts">
const { tours } = defineProps<{
  tours: (keyof typeof tourEnum)[]
}>()

const {
  params: { edId }
} = useRoute("edition")

const {
  data: awards,
  status,
  refresh
} = await useFetch("/api/editions/awards", {
  query: { edId },
  default: () => []
})

type ConsolidatedRound = {
  round: string
  currency: CurrencyEnumType | null
  singles: Record<keyof typeof tourEnum, { pm: number | null; points: number | null }>
  doubles: Record<keyof typeof tourEnum, { pm: number | null; points: number | null }>
}

const consolidatedRounds = computed<ConsolidatedRound[]>(() => {
  const uniqueRounds = useArrayUnique(awards.value.map(a => a.round)).value

  return uniqueRounds.map(round => {
    const singles = awards.value.filter(a => a.round === round && a.type === "Singles")
    const doubles = awards.value.filter(a => a.round === round && a.type === "Doubles")

    const emptyAward = { pm: null, points: null }
    const roundData: ConsolidatedRound = {
      round,
      singles: Object.fromEntries(tours.map(tour => [tour, { ...emptyAward }])) as ConsolidatedRound["singles"],
      doubles: Object.fromEntries(tours.map(tour => [tour, { ...emptyAward }])) as ConsolidatedRound["doubles"],
      currency: singles[0]?.currency ?? doubles[0]?.currency ?? null
    }

    for (const tour of tours) {
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
        <editions-awards-update
          :refresh
          icon-only
        />
      </dev-only>

      <editions-awards-chart
        v-if="awards.length"
        :awards
        :tours
      />
    </template>

    <u-table
      :data="consolidatedRounds"
      :columns="awardColumns(tours, refresh, getRound)"
      :loading="status === 'pending'"
      sticky
      render-fallback-value="—"
      v-model:column-pinning="columnPinning"
      :ui="{ root: 'max-h-150' }"
    >
      <template #loading>
        <loading-icon />
      </template>
      <template #empty>
        <empty
          message="No awards found"
          :icon="ICONS.noAwards"
          class="mx-2"
        >
          <dev-only>
            <editions-awards-update :refresh />
          </dev-only>
        </empty>
      </template>
    </u-table>
  </dashboard-subpanel>
</template>
