<script setup lang="ts">
const { tours } = defineProps<{
  tours: (keyof typeof tourEnum)[]
}>()

const {
  params: { edId }
} = useRoute("edition")
const {
  ui: { icons }
} = useAppConfig()

const {
  data: seeds,
  status,
  refresh
} = await useFetch("/api/editions/seeds", {
  query: { edId },
  default: () => []
})

type ConsolidatedSeed = {
  seed: number
  singles: {
    Main: Record<keyof typeof tourEnum, { team: PersonType[]; rank?: number; withdrew?: boolean }>
    Qualifying: Record<keyof typeof tourEnum, { team: PersonType[]; rank?: number; withdrew?: boolean }>
  }
  doubles: {
    Main: Record<keyof typeof tourEnum, { team: PersonType[]; rank?: number; withdrew?: boolean }>
    Qualifying: Record<keyof typeof tourEnum, { team: PersonType[]; rank?: number; withdrew?: boolean }>
  }
}

const consolidatedSeeds = computed<ConsolidatedSeed[]>(() => {
  const uniqueSeeds = useSorted(useArrayUnique(seeds.value.map(s => s.seed))).value

  return uniqueSeeds.map(seedNumber => {
    const emptySeed = { team: [] as PersonType[], rank: undefined }

    const seedData: ConsolidatedSeed = {
      seed: seedNumber!,
      singles: {
        Main: Object.fromEntries(Object.keys(tourEnum).map(tour => [tour, { ...emptySeed }])) as ConsolidatedSeed["singles"]["Main"],
        Qualifying: Object.fromEntries(Object.keys(tourEnum).map(tour => [tour, { ...emptySeed }])) as ConsolidatedSeed["singles"]["Qualifying"]
      },
      doubles: {
        Main: Object.fromEntries(Object.keys(tourEnum).map(tour => [tour, { ...emptySeed }])) as ConsolidatedSeed["doubles"]["Main"],
        Qualifying: Object.fromEntries(Object.keys(tourEnum).map(tour => [tour, { ...emptySeed }])) as ConsolidatedSeed["doubles"]["Qualifying"]
      }
    }

    for (const tour of tours) {
      const mainSingles = seeds.value.find(s => s.seed === seedNumber && s.type === "Singles" && s.draw === "Main" && s.tour === tour)
      const qualifyingSingles = seeds.value.find(s => s.seed === seedNumber && s.type === "Singles" && s.draw === "Qualifying" && s.tour === tour)
      const mainDoubles = seeds.value.find(s => s.seed === seedNumber && s.type === "Doubles" && s.draw === "Main" && s.tour === tour)
      const qualifyingDoubles = seeds.value.find(s => s.seed === seedNumber && s.type === "Doubles" && s.draw === "Qualifying" && s.tour === tour)

      seedData.singles.Main[tour] = { team: mainSingles?.team ?? [], rank: mainSingles?.rank, withdrew: mainSingles?.withdrew }
      seedData.singles.Qualifying[tour] = {
        team: qualifyingSingles?.team ?? [],
        rank: qualifyingSingles?.rank,
        withdrew: qualifyingSingles?.withdrew
      }
      seedData.doubles.Main[tour] = { team: mainDoubles?.team ?? [], rank: mainDoubles?.rank, withdrew: mainDoubles?.withdrew }
      seedData.doubles.Qualifying[tour] = {
        team: qualifyingDoubles?.team ?? [],
        rank: qualifyingDoubles?.rank,
        withdrew: qualifyingDoubles?.withdrew
      }
    }

    return seedData
  })
})

const columnPinning = ref({
  left: ["seed"],
  right: []
})

const getSeed = (seed: number, tour: keyof typeof tourEnum, draw: DrawEnumType, type: MatchTypeEnumType) => {
  return seeds.value.find(s => s.seed === seed && s.tour === tour && s.draw === draw && s.type === type)
}
</script>

<template>
  <dashboard-subpanel
    title="Seeds"
    :icon="ICONS.seeds"
  >
    <template #right>
      <dev-only>
        <editions-seeds-update
          :refresh
          icon-only
        />
      </dev-only>
      <editions-seeds-chart
        v-if="seeds.length"
        :seeds
      />
    </template>

    <u-table
      :data="consolidatedSeeds"
      :columns="seedColumns(tours, refresh, getSeed)"
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
          message="No seeds found"
          :icon="ICONS.noTournament"
          class="mx-2"
        >
          <dev-only>
            <editions-seeds-update :refresh />
          </dev-only>
        </empty>
      </template>
    </u-table>
  </dashboard-subpanel>
</template>
