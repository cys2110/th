<script setup lang="ts">
const id = useRouteQuery<number>("year", new Date().getFullYear(), { transform: Number })
useHead({ title: () => id.value })
const {
  ui: { icons }
} = useAppConfig()

// const { data: year } = await useFetch("/api/years", {
//   query: { id },
//   default: () => ({ tournaments: [], players: [] })
// })

// const tournamentCollapsibles = computed(() => {
//   const tournamentTypes = useArrayUnique(year.value.tournaments.map(t => t.type)).value

//   const labelMapping = {
//     ESTABLISHED: "established",
//     ABOLISHED: "abolished"
//   }

//   return tournamentTypes.map(type => ({
//     label: labelMapping[type as keyof typeof labelMapping],
//     tournaments: year.value.tournaments.filter(t => t.type === type)
//   }))
// })

// const playerCollapsibles = computed(() => {
//   const playerStatuses = useArrayUnique(year.value.players.map(p => p.type)).value

//   const labelMapping = {
//     Born: "born",
//     Died: "who died",
//     RETIRED: "who retired",
//     TURNED_PRO: "who turned pro",
//     "Hall of Fame Induction": "inducted into the Hall of Fame"
//   }

//   return playerStatuses.map(status => ({
//     label: labelMapping[status as keyof typeof labelMapping],
//     players: year.value.players.filter(p => p.type === status)
//   }))
// })
</script>

<template>
  <u-container>
    <!-- <u-page>
      <template #left>
        <u-page-aside>
          <form-input-menu
            v-model="id"
            :items="ALL_YEARS"
            placeholder="Select Year"
          />
        </u-page-aside>
      </template>

      <u-page-header :title="id.toString()">
        <template #headline>
          <breadcrumbs />
        </template>
      </u-page-header>

      <u-page-body>
        <u-page-columns v-if="year.tournaments.length || year.players.length">
          <u-collapsible
            v-for="type in tournamentCollapsibles"
            :key="type.label"
          >
            <u-button
              class="group my-2"
              :label="`Tournaments ${type.label}`"
              color="neutral"
              block
              :trailing-icon="icons.chevronDown"
              :ui="{
                trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
                base: 'cursor-pointer'
              }"
            />

            <template #content>
              <div
                class="flex flex-col gap-2 max-h-100 overflow-y-auto scrollbar-thin scrollbar-thumb-primary-600 scrollbar-track-transparent scrollbar-thumb-rounded-full text-sm ml-3"
              >
                <u-link
                  v-for="tournament in type.tournaments"
                  :key="tournament.id"
                  :to="{ name: 'tournament', params: { id: tournament.id, name: kebabCase(tournament.name) } }"
                  class="hover-link default-link w-fit"
                >
                  {{ tournament.name }}
                </u-link>
              </div>
            </template>
          </u-collapsible>

          <u-collapsible
            v-for="type in playerCollapsibles"
            :key="type.label"
          >
            <u-button
              class="group my-2"
              :label="`Players ${type.label}`"
              color="neutral"
              block
              :trailing-icon="icons.chevronDown"
              :ui="{
                trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
                base: 'cursor-pointer'
              }"
            />

            <template #content>
              <div
                class="flex flex-col gap-2 max-h-100 overflow-y-auto scrollbar-thin scrollbar-thumb-primary-600 scrollbar-track-transparent scrollbar-thumb-rounded-full text-sm ml-3"
              >
                <player-link
                  v-for="player in type.players"
                  :key="player.id"
                  :player
                />
              </div>
            </template>
          </u-collapsible>
        </u-page-columns>

        <empty
          v-else
          :message="`No details found for ${id}`"
          :icon="ICONS.noEdition"
        />
      </u-page-body>
    </u-page> -->
  </u-container>
</template>
