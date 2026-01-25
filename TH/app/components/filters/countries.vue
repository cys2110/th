<script setup lang="ts">
import type { InputMenuItem } from "@nuxt/ui"

const modelValue = defineModel<OptionType[]>()

const { devMode } = useRuntimeConfig().public

const { data, status, error } = await useFetch("/api/countries", {
  default: () => ({ statusObjects: [], results: [] as CountryType[] })
})

watch(
  () => data.value.statusObjects,
  () => {
    if (data.value?.statusObjects.length && devMode) {
      console.info("Country search results API Status Objects:", data.value.statusObjects)
    }
  }
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

const items = computed<InputMenuItem[]>(() =>
  data.value.results.map(country => ({
    ...country,
    icon: getFlagCode(country)
  }))
)
</script>

<template>
  <u-input-menu
    placeholder="Select countries"
    clear
    :items
    v-model="modelValue"
    multiple
    :icon="ICONS.globe"
    :loading="status === 'pending'"
  />
</template>
