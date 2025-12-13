<script setup lang="ts">
import type { PageLink } from "@nuxt/ui"

definePageMeta({ name: "head-to-head" })
const {
  params: { p1Id, p2Id, p1Name, p2Name }
} = useRoute("head-to-head")

const { data: teams } = await useFetch("/api/h2h/players", {
  query: { p1Id, p2Id }
})

const { data: matches, status } = await useFetch("/api/h2h/matches", {
  query: { p1Id, p2Id },
  default: () => []
})

const teamNames = computed(() => {
  const team1Name = teams.value ? teams.value.team1.players.map(p => `${p.first_name} ${p.last_name}`).join(" / ") : capitalCase(p1Name as string)
  const team2Name = teams.value ? teams.value.team2.players.map(p => `${p.first_name} ${p.last_name}`).join(" / ") : capitalCase(p2Name as string)
  return { team1Name, team2Name }
})

const player1Id = computed({
  get() {
    const p1IdArray = p1Id.split("+")

    if (p1IdArray.length > 1) {
      return undefined
    } else {
      return {
        value: p1Id,
        label: teams ? `${teams.value?.team1.players[0]?.first_name} ${teams.value?.team1.players[0]?.last_name}` : capitalCase(p1Name as string)
      }
    }
  },
  set(newValue) {
    if (newValue) {
      navigateTo({
        name: "head-to-head",
        params: {
          p1Id: newValue.value,
          p2Id,
          p1Name: kebabCase(newValue.label),
          p2Name
        }
      })
    }
  }
})

const player2Id = computed({
  get() {
    const p2IdArray = p2Id.split("+")

    if (p2IdArray.length > 1) {
      return undefined
    } else {
      return {
        value: p2Id,
        label: teams ? `${teams.value?.team2.players[0]?.first_name} ${teams.value?.team2.players[0]?.last_name}` : capitalCase(p2Name as string)
      }
    }
  },
  set(newValue) {
    if (newValue) {
      navigateTo({
        name: "head-to-head",
        params: {
          p1Id,
          p2Id: newValue.value,
          p1Name,
          p2Name: kebabCase(newValue.label)
        }
      })
    }
  }
})

useHead({
  title: () => `${teamNames.value.team1Name} v ${teamNames.value.team2Name} | Head to Head`
})

const playerLinks = computed<PageLink[]>(() => {
  if (teams.value) {
    const team1Links = teams.value.team1.players.map(p => ({
      label: `${p.first_name} ${p.last_name}`,
      to: { name: "player", params: { id: p.id, name: kebabCase(`${p.first_name} ${p.last_name}`) } },
      icon: ICONS.player
    }))
    const team2Links = teams.value.team2.players.map(p => ({
      label: `${p.first_name} ${p.last_name}`,
      to: { name: "player", params: { id: p.id, name: kebabCase(`${p.first_name} ${p.last_name}`) } },
      icon: ICONS.player
    }))
    return [...team1Links, ...team2Links] as PageLink[]
  }

  return []
})
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <u-page-links :links="playerLinks" />

          <u-separator v-if="player1Id && player2Id" />

          <div
            v-if="player1Id && player2Id"
            class="flex items-center gap-2"
          >
            <form-search
              type="Player"
              v-model="player1Id"
            />
            <span> v </span>
            <form-search
              type="Player"
              v-model="player2Id"
            />
          </div>
        </u-page-aside>
      </template>

      <u-page-header :title="`${teamNames.team1Name} v ${teamNames.team2Name}`">
        <template #headline>
          <breadcrumbs />
        </template>
      </u-page-header>

      <u-page-body>
        <div
          class="flex flex-col md:grid md:grid-cols-2 lg:flex lg:flex-row items-center gap-8 max-w-lg overflow-x-auto md:max-w-none 2xl:overflow-x-clip"
        >
          <div class="flex flex-col items-center">
            <div class="font-bold">All Time</div>
            <h2h-chart
              :t1Wins="matches.filter(match => match.winning_team === 't1').length"
              :t2Wins="matches.filter(match => match.winning_team === 't2').length"
            />
          </div>

          <div class="flex flex-col items-center lg:order-last">
            <div class="font-bold">Tour</div>
            <h2h-chart
              :t1Wins="matches.filter(match => match.winning_team === 't1' && match.level === 'Tour').length"
              :t2Wins="matches.filter(match => match.winning_team === 't2' && match.level === 'Tour').length"
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
    </u-page>
  </u-container>
</template>
