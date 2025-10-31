<script setup lang="ts">
const id = useRouteQuery<string>("year", new Date().getFullYear().toString())
useHead({ title: () => id.value, templateParams: { subPage: "Years" } })
const appConfig = useAppConfig()
const toast = useToast()

// Breadcrumbs
const breadcrumbs = [
  { label: "Home", to: { name: "home" }, icon: ICONS.home },
  { label: "Years", icon: ICONS.calendar },
  { label: id.value, icon: ICONS.year }
]

interface YearAPIResponse {
  established_tournaments: Pick<TournamentInterface, "id" | "name">[]
  abolished_tournaments: Pick<TournamentInterface, "id" | "name">[]
  pro_players: Pick<PlayerInterface, "id" | "name" | "country">[]
  retired_players: Pick<PlayerInterface, "id" | "name" | "country">[]
  born_players: Pick<PlayerInterface, "id" | "name" | "country">[]
  died_players: Pick<PlayerInterface, "id" | "name" | "country">[]
  hof: Pick<PlayerInterface, "id" | "name" | "country">[]
}

const { data: year } = await useFetch<YearAPIResponse>("/api/years/details", {
  query: { id },
  onResponseError: ({ error }) => {
    toast.add({
      title: `Error fetching year details for ${id.value}`,
      description: error?.message,
      icon: appConfig.ui.icons.error,
      color: "error"
    })
    showError(error!)
  }
})

const tournamentCollapsibles = [
  { label: "established", tournaments: year.value?.established_tournaments },
  { label: "abolished", tournaments: year.value?.abolished_tournaments }
]

const playerCollapsibles = [
  { label: "who turned pro", players: year.value?.pro_players },
  { label: "who retired", players: year.value?.retired_players },
  { label: "who were born", players: year.value?.born_players },
  { label: "who died", players: year.value?.died_players },
  { label: "inducted into the Hall of Fame", players: year.value?.hof }
]
</script>

<template>
  <div class="w-full">
    <u-dashboard-panel>
      <template #header>
        <u-dashboard-navbar>
          <template #leading>
            <u-dashboard-sidebar-collapse />
          </template>

          <template #title>
            <u-breadcrumb :items="breadcrumbs" />
          </template>
        </u-dashboard-navbar>

        <u-dashboard-toolbar>
          <all-years-select v-model="id" />
        </u-dashboard-toolbar>
      </template>

      <template #body>
        <u-page-grid
          v-if="year"
          class="xl:grid-cols-4 2xl:grid-cols-4"
        >
          <year-tournament-collapsible
            v-for="tournament in tournamentCollapsibles"
            :key="tournament.label"
            :label="tournament.label"
            :tournaments="tournament.tournaments"
            :year="id"
          />
          <year-player-collapsible
            v-for="player in playerCollapsibles"
            :key="player.label"
            :label="player.label"
            :players="player.players"
            :year="id"
          />
        </u-page-grid>
        <error-message
          v-else
          :message="`Error fetching year details for ${id}`"
          :icon="ICONS.noCalendar"
        />
      </template>
    </u-dashboard-panel>
  </div>
</template>
