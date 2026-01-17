<script setup lang="ts">
defineProps<{
  country: CountryType
}>()

const {
  params: { id }
} = useRoute("country")

// API call
const {
  data: players,
  status,
  error
} = await useFetch("/api/country/number-ones", {
  query: { id },
  default: () => []
})

watch(
  error,
  () => {
    if (error.value) {
      if (error.value.statusMessage === "Validation errors") {
        console.error(error.value.statusMessage, error.value.data?.data.validationErrors)
      } else {
        console.error(error.value)
      }
    }
  },
  { immediate: true }
)
</script>

<template>
  <dashboard-subpanel
    :title="`Players who achieved No. 1 ranking representing ${country.name}`"
    :icon="ICONS.one"
  >
    <u-page-columns v-if="players.length || status === 'pending'">
      <country-number-ones-card
        v-if="players.length"
        v-for="player in players"
        :key="player.id"
        :player
      />

      <country-number-ones-loading
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
