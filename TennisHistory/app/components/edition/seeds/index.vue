<script setup lang="ts">
import type { VisibilityState } from "@tanstack/vue-table"

const {
  params: { edId }
} = useRoute("edition")
const tournamentStore = useTournamentStore()

const {
  data: seeds,
  status,
  refresh
} = await useFetch("/api/edition/seeds", {
  query: { edId },
  default: () => [],
  onResponseError: ({ error }) => console.error("Error fetching edition seeds:", error)
})

const consolidatedSeeds = computed(() => {
  const uniqueSeeds = useSorted(useArrayUnique(seeds.value.map(s => s.seed))).value

  return uniqueSeeds.map(seedNumber => {
    const seedEntries = seeds.value.filter(s => s.seed === seedNumber)

    return {
      seed: seedNumber,
      entries: seedEntries
    } as {
      seed: number
      entries: SeedType[]
    }
  })
})

const columnVisibility = computed(() => {
  const visibility: VisibilityState = {}

  if (!seeds.value.some(s => s.type === "Singles" && isDefined(s.seed))) {
    tournamentStore.tours.forEach(tour => {
      visibility[`singles-main-${tour}-team`] = false
      visibility[`singles-main-${tour}-rank`] = false
    })
  }

  if (!seeds.value.some(s => s.type === "Singles" && isDefined(s.q_seed))) {
    tournamentStore.tours.forEach(tour => {
      visibility[`singles-qualifying-${tour}-team`] = false
      visibility[`singles-qualifying-${tour}-rank`] = false
    })
  }

  if (!seeds.value.some(s => s.type === "Doubles" && isDefined(s.seed))) {
    tournamentStore.tours.forEach(tour => {
      visibility[`doubles-main-${tour}-team`] = false
      visibility[`doubles-main-${tour}-rank`] = false
    })
  }

  if (!seeds.value.some(s => s.type === "Doubles" && isDefined(s.q_seed))) {
    tournamentStore.tours.forEach(tour => {
      visibility[`doubles-qualifying-${tour}-team`] = false
      visibility[`doubles-qualifying-${tour}-rank`] = false
    })
  }

  return visibility
})
</script>

<template>
  <dashboard-subpanel
    title="Seeds"
    :icon="ICONS.seeds"
  >
    <template #right>
      <dev-only>
        <edition-seeds-update
          :refresh
          icon-only
        />
      </dev-only>
      <edition-seeds-chart
        :seeds
        :status
      />
    </template>

    <u-table
      :data="consolidatedSeeds"
      :columns="seedColumns(refresh)"
      :loading="status === 'pending'"
      sticky
      render-fallback-value="—"
      v-model:column-visibility="columnVisibility"
      :ui="{ th: 'py-0.5 text-center', td: 'text-center' }"
    >
      <template #loading>
        <loading-icon />
      </template>
      <template #empty>
        <empty
          message="No seeds found"
          :icon="ICONS.trophyOff"
        >
          <dev-only>
            <edition-seeds-update :refresh />
          </dev-only>
        </empty>
      </template>
    </u-table>
  </dashboard-subpanel>
</template>
