<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues } from "@tanstack/vue-table"

const {
  params: { id }
} = useRoute("tournament")
const router = useRouter()
const tournamentStore = useTournamentStore()
const table = useTemplateRef("table")

const { data, status } = await useFetch("/api/tournament/finalists", {
  query: { id },
  default: () => [],
  onResponseError: ({ error }) => console.error("Error fetching tournament finalists:", error)
})

const aggregatedData = computed<TournamentCountryType[]>(() => {
  const uniqueCountries = useArrayUnique(
    data.value.map(d => d.country),
    (a, b) => a!.id === b!.id
  ).value

  return uniqueCountries.map(country => {
    const countryData = data.value.filter(d => d.country?.id === country!.id)
    const tours = tournamentStore.tours

    const tourObject = {
      distinct_singles_wins: 0,
      distinct_doubles_wins: 0,
      distinct_singles_losses: 0,
      distinct_doubles_losses: 0,
      singles_wins: 0,
      doubles_wins: 0,
      singles_losses: 0,
      doubles_losses: 0
    }

    tours.forEach(tour => {
      const tourData = countryData.filter(d => d.tour === tour)

      tourObject.distinct_singles_wins += useArrayUnique(tourData.filter(d => d.title && d.type === "Singles").map(d => d.id)).value.length
      tourObject.distinct_doubles_wins += useArrayUnique(tourData.filter(d => d.title && d.type === "Doubles").map(d => d.id)).value.length

      tourObject.singles_wins += tourData.reduce((acc, curr) => acc + (curr.type === "Singles" && curr.title ? 1 : 0), 0)
      tourObject.doubles_wins += tourData.reduce((acc, curr) => acc + (curr.type === "Doubles" && curr.title ? 1 : 0), 0)
    })

    const toursObj = Object.fromEntries(tours.map(tour => [tour, { ...tourObject }]))

    return {
      ...country!,
      ...toursObj
    } as TournamentCountryType
  })
})

const handleSelectRow = (_e: Event, row: TableRow<TournamentCountryType>) => {
  const { id: countryId, name } = row.original

  router.push({
    name: "country",
    params: {
      id: countryId,
      name: kebabCase(name)
    }
  })
}
</script>

<template>
  <dashboard-subpanel
    title="Countries by No. of Winners"
    :icon="ICONS.globe"
  >
    <template #right>
      <table-client-clear-filters
        v-if="table"
        :table
      />

      <tournament-numbers-country-chart
        :winners="data"
        :status
      />
    </template>

    <u-table
      ref="table"
      :data="aggregatedData"
      :columns="tournamentCountryColumns()"
      :loading="status === 'pending'"
      sticky
      @select="handleSelectRow"
      :faceted-options="{
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues()
      }"
      :ui="{ th: 'text-center py-1', td: 'empty:p-0 text-center' }"
    >
      <template #loading>
        <loading-icon />
      </template>
      <template #empty>
        <empty
          :message="`No editions have been played for ${tournamentStore.name}`"
          :icon="ICONS.trophyOff"
        />
      </template>
    </u-table>
  </dashboard-subpanel>
</template>
