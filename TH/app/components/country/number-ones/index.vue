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
  newError => {
    if (newError) {
      if (newError.statusMessage) {
        console.error(newError.statusMessage, newError.data?.data)
      } else {
        console.error(newError)
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
    <!--Show error messages on dev-->
    <dev-only v-if="error">
      <u-alert
        :title="error.statusMessage || `Error fetching country number ones for ${country.name}`"
        color="error"
      >
        <template #description>
          <div
            v-for="(item, index) in error.data?.data"
            :key="index"
          >
            {{ item }}
          </div>
        </template>
      </u-alert>
    </dev-only>

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
