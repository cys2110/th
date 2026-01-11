<script setup lang="ts">
const {
  params: { edId, year }
} = useRoute("edition")
const tournamentStore = useTournamentStore()

const { data: seeds, status } = await useFetch("/api/edition/seeds/country", {
  query: { edId },
  default: () => [],
  onResponseError: ({ error }) => console.error("Error fetching edition country seeds:", error)
})
</script>

<template>
  <dashboard-subpanel
    title="Seeds"
    :icon="ICONS.seeds"
  >
    <table
      v-if="seeds.length || status === 'pending'"
      class="min-w-1/3 mx-auto [&_td]:px-2"
    >
      <thead>
        <tr>
          <th class="text-center">Seed</th>
          <th class="text-left">Country</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-if="seeds.length"
          v-for="seed in seeds"
          :key="seed.id"
        >
          <td class="text-center">{{ seed.seed }}</td>
          <td>
            <country-link :country="seed" />
          </td>
        </tr>
        <tr v-else>
          <td>
            <u-skeleton class="w-sm h-3" />
          </td>
          <td>
            <u-skeleton class="w-12 h-3" />
          </td>
        </tr>
      </tbody>
    </table>

    <empty
      v-else
      :message="`No countries were seeded for ${tournamentStore.name} ${year}`"
      :icon="ICONS.globeOff"
    />
  </dashboard-subpanel>
</template>
