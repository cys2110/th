<script setup lang="ts">
const props = defineProps<{
  team1Ids: string[]
  team2Ids: string[]
  team1Names: string[]
  team2Names: string[]
}>()

const apiKey = computed(() => `${props.team1Ids?.join("-")}-${props.team2Ids?.join("-")}`)

const { data: teams, error: playersError } = await useFetch("/api/h2h/players", {
  key: apiKey,
  method: "POST",
  body: { team1Ids: props.team1Ids, team2Ids: props.team2Ids }
})

watch(
  playersError,
  () => {
    if (playersError.value) {
      if (playersError.value.statusMessage === "Validation errors") {
        console.error(playersError.value.statusMessage, playersError.value.data?.data.validationErrors)
      } else {
        console.error(playersError.value)
      }
    }
  },
  { immediate: true }
)

const teamNames = computed(() => {
  const team1Name = teams.value ? teams.value.team1.players.map(p => `${p.first_name} ${p.last_name}`).join(" / ") : props.team1Names.join(" / ")
  const team2Name = teams.value ? teams.value.team2.players.map(p => `${p.first_name} ${p.last_name}`).join(" / ") : props.team2Names.join(" / ")
  return { team1Name, team2Name }
})

useHead({
  title: () => `${get(teamNames).team1Name} v ${get(teamNames).team2Name}`,
  templateParams: {
    category: "H2H"
  }
})

const {
  data: matches,
  status,
  error
} = await useFetch("/api/h2h/matches", {
  method: "POST",
  body: { team1Ids: props.team1Ids, team2Ids: props.team2Ids },
  default: () => []
})

watch(
  error,
  () => {
    if (error.value) {
      if (error.value.statusMessage === "Validation errors") {
        console.error(error.value.statusMessage, error.value.data?.data.validationErrors)
      } else {
        console.error(error.value)
      }
    }
  },
  { immediate: true }
)
</script>

<template>
  <u-page-header
    headline="Head to Head"
    :title="`${teamNames.team1Name} v ${teamNames.team2Name}`"
  />

  <u-page-body>
    <div
      class="flex flex-col md:grid md:grid-cols-2 lg:flex lg:flex-row items-center gap-8 max-w-lg overflow-x-auto md:max-w-none 2xl:overflow-x-clip"
    >
      <div class="flex flex-col items-center">
        <h2h-chart
          title="All Levels"
          :t1Wins="matches.filter(match => match.winning_team === 't1').length"
          :t2Wins="matches.filter(match => match.winning_team === 't2').length"
          :status
        />
      </div>

      <div class="flex flex-col items-center lg:order-last">
        <h2h-chart
          title="Tour"
          :t1Wins="matches.filter(match => match.winning_team === 't1' && match.level === 'Tour').length"
          :t2Wins="matches.filter(match => match.winning_team === 't2' && match.level === 'Tour').length"
          :status
        />
      </div>

      <h2h-details
        v-if="teams"
        :teams
        class="md:col-span-2 lg:flex-1"
      />
    </div>

    <h2h-matches
      v-if="teams"
      :matches
      :status
      :teams
    />
  </u-page-body>
</template>
