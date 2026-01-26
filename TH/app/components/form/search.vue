<script setup lang="ts">
import type { InputMenuItem } from "@nuxt/ui"

const props = withDefaults(
  defineProps<{
    placeholder?: string
    type: string
    icon?: string
    multiple?: boolean
  }>(),
  {
    multiple: false
  }
)

const modelValue = defineModel<OptionType | OptionType[]>()

const { devMode } = useRuntimeConfig().public

const searchTerm = ref("")

const { data, status, execute, refresh, error } = await useLazyFetch<{
  statusObjects: string[]
  results: (OptionType & { country?: CountryType })[]
}>("/api/filter-search", {
  query: { search: searchTerm, type: props.type },
  default: () => ({ statusObjects: [], results: [] }),
  immediate: false
})

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

const onOpen = () => {
  if (!get(results).length) {
    execute()
  }
}
</script>

<template>
  <u-input-menu
    :placeholder="`Select ${placeholder?.toLowerCase() ?? `${type.toLowerCase()}s`}`"
    clear
    :items="results"
    v-model="modelValue"
    :multiple
    :icon
    :loading="status === 'pending'"
    v-model:search-term="searchTerm"
  >
    <template #content-bottom>
      <dev-only>
        <venue-update
          v-if="type === 'Venue'"
          @refresh="refresh"
        />
        <person-update
          v-else-if="['Supervisor', 'Coach', 'Umpire'].includes(type)"
          :type="<'Supervisor' | 'Coach' | 'Umpire'>type"
          @refresh="refresh"
        />
      </dev-only>
    </template>
  </u-input-menu>
</template>
