<script setup lang="ts">
const {
  params: { id }
} = useRoute("edition")

const tournamentStore = useTournamentStore()

const viewType = ref("By Player")
const refresh = ref(0)
</script>

<template>
  <dashboard-subpanel
    title="Entries"
    :icon="COUNTRY_DRAWS.includes(id) ? ICONS.globe : ICONS.player"
  >
    <template #right>
      <dev-only>
        <edition-entries-activity
          v-if="tournamentStore.tours.includes('ATP')"
          @refresh="refresh++"
        />

        <edition-entries-country-create
          v-if="COUNTRY_DRAWS.includes(id)"
          @refresh="refresh++"
        />

        <edition-entries-country-player-create
          v-if="COUNTRY_DRAWS.includes(id)"
          @refresh="refresh++"
        />

        <edition-entries-create @refresh="refresh++" />
      </dev-only>

      <u-radio-group
        v-model="viewType"
        :items="['By Player', 'By Team']"
        orientation="horizontal"
        class="ml-2"
      />
    </template>

    <edition-entries-players
      v-if="viewType === 'By Player'"
      :refresh
    />

    <template v-else>
      <edition-entries-country-teams
        v-if="COUNTRY_DRAWS.includes(id)"
        :refresh
      />

      <edition-entries-teams v-else />
    </template>
  </dashboard-subpanel>
</template>
