<script setup lang="ts">
/**
 * @description Component to display players who have achieved No. 1 ranking for a country
 * @param {CountryType} country
 */

defineProps<{ country: CountryType }>()

const {
  params: { id }
} = useRoute("country")

// API call
const { data: players, status } = await useFetch("/api/country/number-ones", {
  query: { id },
  default: () => []
})
</script>

<template>
  <dashboard-subpanel
    :title="`Players who achieved No. 1 ranking representing ${country.name}`"
    :icon="ICONS.one"
  >
    <u-page-columns v-if="players.length || status === 'pending'">
      <countries-number-ones-card
        v-if="players.length"
        v-for="player in players"
        :key="player.id"
        :player
      />

      <countries-number-ones-loading
        v-else
        v-for="_ in 3"
        :key="_"
      />
    </u-page-columns>

    <empty
      v-else
      :message="`No players have achived the No. 1 ranking representing ${country.name}`"
      :icon="ICONS.peopleOff"
    />
  </dashboard-subpanel>
</template>
