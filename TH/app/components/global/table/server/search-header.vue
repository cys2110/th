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
    v-model="modelValue"
    v-model:search-term="searchTerm"
    :placeholder="label"
    :loading="status === 'pending'"
    :items="data"
    variant="none"
    :icon
    class="min-w-30"
    :multiple
    clear
  />
</template>
