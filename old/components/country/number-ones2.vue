<script setup lang="ts">
const { icons } = useAppConfig()
const {
  params: { id, name }
} = useRoute("country")

const countryName = useState<string>("country-name")

// API call
const { data: players, status } = await useFetch<PlayerInterface[]>("/api/countries/number-ones", {
  query: { id },
  default: () => [],
  server: false
})
</script>

<template>
  <dashboard-subpanel
    :title="`Players who achieved No. 1 ranking representing ${countryName || capitalCase(name as string)}`"
    :icon="icons.one"
    id="number-ones"
  >
    <u-page-columns
      v-if="players.length || ['idle', 'pending'].includes(status)"
      class="scroll-smooth overflow-y-auto p-5 lg:columns-2"
    >
      <u-page-card
        v-if="players.length"
        v-for="player in players"
        :key="player.id"
        :to="{ name: 'player', params: { id: player.id, name: kebabCase(`${player.first_name}-${player.last_name}`) } }"
        highlight
        :highlight-color="getTourColour(player.tour)"
        :title="`${player.first_name} ${player.last_name}`"
        :ui="{ leading: 'flex items-center gap-2' }"
      >
        <template #leading>
          <country-link :country="player.country" />
          <coloured-badge :label="player.tour" />
        </template>

        <template #description>
          <div
            v-if="player.singles_ch_date"
            class="flex items-center gap-2"
          >
            <span>Singles Career High: </span>
            <span class="font-semibold"> {{ player.ch_singles }} ({{ dateTimeFormat.format(getDate(player.singles_ch_date)) }}) </span>
          </div>
          <div
            v-if="player.doubles_ch_date"
            class="flex items-center gap-2"
          >
            <span>Doubles Career High: </span>
            <span class="font-semibold"> {{ player.ch_doubles }} ({{ dateTimeFormat.format(getDate(player.doubles_ch_date)) }}) </span>
          </div>
        </template>
      </u-page-card>

      <loading-player
        v-else
        v-for="_ in 6"
        :key="_"
      />
    </u-page-columns>
    <error-message
      v-else
      :message="`No players who achieved the No. 1 ranking representing ${countryName || capitalCase(name as string)}`"
      :icon="icons.noPlayer"
    />
  </dashboard-subpanel>
</template>
