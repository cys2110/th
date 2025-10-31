<script setup lang="ts">
definePageMeta({ name: "tournament" })
const {
  params: { id, name }
} = useRoute("tournament")

const selectedTab = ref("Winners")

const { data: tournament, refresh } = await useFetch<TournamentInterface>("/api/tournaments/overview", {
  key: `tournament-overview-${id}`,
  query: { id }
})

useHead({ title: () => tournament.value?.name ?? "Tournament" })
const tours = useState<(keyof typeof TourEnum)[]>("tours", () => tournament.value?.tours || [])
const tournamentName = useState<string>("tournamentName", () => tournament.value?.name || capitalCase(name))
</script>

<template>
  <div class="w-full">
    <template v-if="tournament">
      <tournaments-winners
        v-if="selectedTab === 'Winners'"
        v-model="selectedTab"
        :tournament
        :refresh
      />
      <tournaments-numbers
        v-else
        v-model="selectedTab"
        :tournament
      />
    </template>
  </div>
</template>
