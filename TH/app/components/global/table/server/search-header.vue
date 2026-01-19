<script setup lang="ts">
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

const searchTerm = ref("")

const { data, status, execute } = await useLazyFetch<(OptionType & { icon?: CountryType })[]>("/api/filter-search", {
  query: { search: searchTerm, type: props.type },
  default: () => [],
  immediate: false,
  transform: (data: any) =>
    data.map((item: any) => ({
      ...item,
      icon: item.country ? getFlagCode(item.country) : undefined
    }))
})
</script>

<template>
  <u-input-menu
    :placeholder="label"
    variant="none"
    clear
    :items="data"
    v-model="modelValue"
    :multiple
    :icon
    v-model:search-term="searchTerm"
    :loading="status === 'pending'"
    class="min-w-30"
  />
</template>
