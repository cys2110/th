<script setup lang="ts">
const props = defineProps<{
  type: string
  icon?: string
  placeholder?: string
}>()

const searchTerm = ref("")
const modelValue = defineModel<OptionType[]>()

const { data, status } = await useLazyFetch<(OptionType & { country?: CountryType })[]>("/api/filter-search", {
  query: { search: searchTerm, type: props.type },
  default: () => []
})

const groups = computed(() => [
  {
    id: "results",
    label: get(searchTerm) ? `${props.placeholder ?? `${props.type}s`} matching ${get(searchTerm)}` : props.placeholder ?? `${props.type}s`,
    items:
      get(data).map(item => ({
        ...item,
        icon: item.country ? getFlagCode(item.country) : undefined,
        onSelect: () => {
          const exists = get(modelValue)?.find(i => i.value === item.value)
          if (exists) {
            set(modelValue, get(modelValue)?.filter(i => i.value !== item.value) || [])
          } else {
            set(modelValue, [...(get(modelValue) || []), item])
          }
        }
      })) || []
  }
])
</script>

<template>
  <u-command-palette
    v-model:search-term="searchTerm"
    :loading="status === 'pending'"
    :groups
    :fuse="{ resultLimit: 22 }"
    :placeholder="`Search ${placeholder?.toLowerCase() ?? `${type.toLowerCase()}s`}`"
    :icon
    multiple
  >
    <template #empty>
      <empty :message="`No ${placeholder?.toLowerCase() ?? `${type.toLowerCase()}s`} found`" />
    </template>
  </u-command-palette>
</template>
