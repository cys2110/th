<script setup lang="ts">
import type { PageLink } from "@nuxt/ui"
const team1RouteQuery = useRouteQuery("team1")
const team2RouteQuery = useRouteQuery("team2")

const team1Ids = computed(() => {
  if (!team1RouteQuery.value) return []

  if (Array.isArray(team1RouteQuery.value)) {
    return team1RouteQuery.value.map(val => val.split(":")[1])
  } else {
    return [team1RouteQuery.value.split(":")[1]]
  }
})

const team2Ids = computed(() => {
  if (!team2RouteQuery.value) return []

  if (Array.isArray(team2RouteQuery.value)) {
    return team2RouteQuery.value.map(val => val.split(":")[1])
  } else {
    return [team2RouteQuery.value.split(":")[1]]
  }
})

const team1Names = computed(() => {
  if (!team1RouteQuery.value) return []

  if (Array.isArray(team1RouteQuery.value)) {
    return team1RouteQuery.value.map(val => startCase(val.split(":")[0]))
  } else {
    return [startCase(team1RouteQuery.value.split(":")[0])]
  }
})

const team2Names = computed(() => {
  if (!team2RouteQuery.value) return []

  if (Array.isArray(team2RouteQuery.value)) {
    return team2RouteQuery.value.map(val => startCase(val.split(":")[0]))
  } else {
    return [startCase(team2RouteQuery.value.split(":")[0])]
  }
})

const team1 = ref<OptionType[]>()
const team2 = ref<OptionType[]>()

watchOnce(
  [team1Ids, team2Ids, team1Names, team2Names],
  () => {
    if (team1Ids.value && team2Ids.value && team1Names.value && team2Names.value && !team1.value && !team2.value) {
      team1.value = team1Ids.value.map((id, index) => ({
        value: id || "",
        label: team1Names.value[index] || "Unknown"
      }))
      team2.value = team2Ids.value.map((id, index) => ({
        value: id || "",
        label: team2Names.value[index] || "Unknown"
      }))
    }
  },
  { immediate: true }
)

watchDeep(
  [team1, team2],
  () => {
    if (team1.value && team2.value) {
      set(
        team1RouteQuery,
        team1.value.map(p => `${kebabCase(p.label)}:${p.value}`)
      )
      set(
        team2RouteQuery,
        team2.value.map(p => `${kebabCase(p.label)}:${p.value}`)
      )
    }
  },
  { immediate: true }
)

const apiKey = computed(() => `${team1Ids.value?.join("-")}-${team2Ids.value?.join("-")}`)

const { data: teams, execute } = await useFetch("/api/h2h/players", {
  key: apiKey,
  method: "POST",
  body: { team1Ids, team2Ids },
  immediate: false
})

watch(
  [team1Ids, team2Ids],
  () => {
    if (team1Ids.value?.length && team2Ids.value?.length) {
      execute()
    }
  },
  { immediate: true }
)

watch(
  teams,
  () => {
    if (teams.value) {
      team1.value = teams.value.team1.players.map(p => ({
        value: p.id,
        label: `${p.first_name} ${p.last_name}`
      }))

      team2.value = teams.value.team2.players.map(p => ({
        value: p.id,
        label: `${p.first_name} ${p.last_name}`
      }))
    }
  },
  { immediate: true }
)

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
          <filters-search
            type="Player"
            placeholder="Team 1"
            multiple
            v-model="team1"
          />

          <filters-search
            type="Player"
            placeholder="Team 2"
            multiple
            v-model="team2"
          />

          <u-separator v-if="team1Ids?.length && team2Ids?.length" />

          <u-page-links
            v-if="team1Ids?.length && team2Ids?.length"
            :links="playerLinks"
          />
        </u-page-aside>
      </template>

      <h2h
        v-if="team1Ids?.length && team2Ids?.length"
        :team1Ids
        :team2Ids
        :team1Names
        :team2Names
      />
      <h2h-table v-else />
    </u-page>
  </u-container>
</template>
