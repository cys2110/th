<script setup lang="ts">
import type { InputMenuItem } from "@nuxt/ui"

const modelValue = useRouteQuery("country", null, {
  transform: {
    get: parseOption,
    set: serialiseOption
  }
})

const { devMode } = useRuntimeConfig().public

const { data, status, error } = await useFetch("/api/countries", {
  default: () => ({ statusObjects: [], results: [] as CountryType[] })
})

const items = computed<InputMenuItem[]>(() =>
  data.value.results.map(country => ({
    value: country.id,
    label: country.name,
    icon: getFlagCode(country)
  }))
)

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
</script>

<template>
  <u-input-menu
    placeholder="Select countries"
    variant="none"
    clear
    :items
    v-model="modelValue"
    multiple
    :icon="ICONS.globe"
    :loading="status === 'pending'"
  />
</template>
