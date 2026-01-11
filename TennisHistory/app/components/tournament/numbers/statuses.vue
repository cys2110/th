<script setup lang="ts">
const {
  params: { id, name }
} = useRoute("tournament")
const tournamentStore = useTournamentStore()

const { data, status } = await useFetch("/api/tournament/statuses", {
  query: { id },
  default: () => [],
  onResponseError: ({ error }) => console.error(error)
})
</script>

<template>
  <dashboard-subpanel
    title="Qualifiers / Lucky Losers / Alternates / Wild Cards Winners"
    :icon="ICONS.one"
  >
    <u-page-columns
      v-if="data.length || status === 'pending'"
      class="my-5 p-5"
    >
      <u-page-card
        v-if="data.length"
        v-for="(edition, index) in data"
        :key="index"
        highlight
        :title="edition.year.toString()"
        :to="{
          name: 'edition',
          params: {
            id,
            name,
            year: edition.year,
            edId: edition.id
          }
        }"
        :ui="{ body: 'w-full', footer: 'text-sm' }"
      >
        <template #description>
          <player-link
            v-for="player in edition.team"
            :key="player.id"
            :player
          />
        </template>

        <template #footer> {{ edition.type }} - {{ statusEnum[edition.status] }} </template>
      </u-page-card>
    </u-page-columns>

    <empty
      v-else
      :message="`No qualifiers, lucky losers, alternates or wild cards have won ${tournamentStore.name}`"
    />
  </dashboard-subpanel>
</template>
