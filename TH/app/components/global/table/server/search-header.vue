<script setup lang="ts">
import type { InputMenuItem } from "@nuxt/ui"

const props = withDefaults(
  defineProps<{
    label: string
    type: string
    filterKey: string
    multiple?: boolean
    icon?: string
  }>(),
  {
    multiple: false,
    icon: ICONS.filter
  }
)

const modelValue = useRouteQuery(props.filterKey, null, {
  transform: {
    get: parseOption,
    set: serialiseOption
  }
})

const { devMode } = useRuntimeConfig().public

const searchTerm = ref("")

const { data, status, error } = await useLazyFetch<{ statusObjects: string[]; results: (OptionType & { country?: CountryType })[] }>(
  "/api/filter-search",
  {
    query: { search: searchTerm, type: props.type },
    default: () => ({ statusObjects: [], results: [] }),
    immediate: false
  }
)

const results = computed<InputMenuItem[]>(() =>
  data.value.results.map(item => {
    if (item.country) {
      return {
        ...item,
        icon: getFlagCode(item.country)
      }
    }
    return item
  })
)

watch(
  () => data.value.statusObjects,
  () => {
    if (data.value?.statusObjects.length && devMode) {
      console.info("Search results API Status Objects:", data.value.statusObjects)
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
    :placeholder="label"
    variant="none"
    clear
    :items="results"
    v-model="modelValue"
    :multiple
    :icon
    v-model:search-term="searchTerm"
    :loading="status === 'pending'"
  />
</template>
