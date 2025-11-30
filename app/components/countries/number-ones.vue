<script setup lang="ts">
defineProps<{ country: CountryType }>()
const {
  params: { id }
} = useRoute("country")

// API call
const { data: players, status } = await useFetch("/api/countries/number-ones", {
  query: { id },
  default: () => []
})
</script>

<template>
  <dashboard-subpanel
    :title="`Players who achived No. 1 ranking representing ${country.name}`"
    :icon="ICONS.one"
  >
    <u-page-columns v-if="players.length || status === 'pending'">
      <u-page-card
        v-if="players.length"
        v-for="player in players"
        :key="player.id"
        :to="{ name: 'player', params: { id: player.id, name: kebabCase(`${player.first_name} ${player.last_name}`) } }"
        :title="`${player.first_name} ${player.last_name}`"
        highlight
        :highlight-color="player.tour"
      >
        <template #description>
          <div class="grid grid-cols-2 items-center">
            <div
              v-if="player.singles_ch_date"
              class="flex flex-col"
            >
              <div>Singles Career High:</div>
              <div class="font-semibold ml-3"> {{ player.ch_singles }} ({{ useDateFormat(player.singles_ch_date, "DD MMMM YYYY") }}) </div>
            </div>

            <div
              v-if="player.doubles_ch_date"
              class="flex flex-col"
            >
              <div>Doubles Career High:</div>
              <div class="font-semibold ml-3"> {{ player.ch_doubles }} ({{ useDateFormat(player.doubles_ch_date, "DD MMMM YYYY") }}) </div>
            </div>
          </div>
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
      :message="`No players have achieved the No. 1 ranking representing ${country.name}`"
      :icon="ICONS.noPeople"
    />
  </dashboard-subpanel>
</template>
