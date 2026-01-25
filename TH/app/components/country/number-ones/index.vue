<script setup lang="ts">
const props = defineProps<{
  country: CountryType
}>()

const {
  params: { id }
} = useRoute("country")

const { devMode } = useRuntimeConfig().public

// API call
const { data, status, error } = await useFetch("/api/country/number-ones", {
  query: { id },
  default: () => ({ results: [] as CountryNumberOneType[], statusObjects: [] })
})

watch(
  () => data.value.statusObjects,
  () => {
    if (data.value?.statusObjects.length && devMode) {
      console.info(`${props.country.name} Number Ones API Status Objects:`, data.value.statusObjects)
    }
  },
  { immediate: true }
)

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
    <api-alerts :error />

    <u-page-columns v-if="data.results.length || status === 'pending'">
      <country-number-ones-card
        v-if="data.results.length"
        v-for="player in data.results"
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
