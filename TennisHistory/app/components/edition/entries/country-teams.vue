<script setup lang="ts">
const {
  params: { edId, year }
} = useRoute("edition")
const tournamentStore = useTournamentStore()

const { data: entries, status } = await useFetch("/api/edition/entries/country-teams", {
  query: { edId },
  default: () => [],
  onResponseError: ({ error }) => console.error("Error fetching edition country teams entries:", error)
})
</script>

<template>
  <u-page-columns v-if="entries.length || status === 'pending'">
    <u-page-card
      v-if="entries.length"
      v-for="entry in entries"
      :key="entry.id"
      :title="entry.name"
      highlight
      :ui="{ leading: 'flex w-full justify-between items-center', body: 'w-full' }"
    >
      <template #leading>
        <u-icon :name="getFlagCode(entry)" />

        <u-badge
          v-if="entry.seed"
          :label="entry.seed"
          color="success"
        />
      </template>

      <template
        #description
        v-if="entry.team?.length"
      >
        <table class="w-full">
          <thead>
            <tr>
              <th />
              <th>Singles</th>
              <th>Doubles</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="player in entry.team"
              :key="player.id"
              class="*:not-first:text-center"
            >
              <td>{{ player.first_name }} {{ player.last_name }}</td>
              <td>{{ player.singles ?? "—" }}</td>
              <td>{{ player.doubles ?? "—" }}</td>
            </tr>
          </tbody>
        </table>
      </template>
    </u-page-card>

    <loading-base
      v-else
      v-for="_ in 6"
      :key="_"
    />
  </u-page-columns>

  <empty
    v-else
    :message="`No countries have entered ${tournamentStore.name} ${year}.`"
    :icon="ICONS.globeOff"
  >
    <edition-entries-country-update />
  </empty>
</template>
