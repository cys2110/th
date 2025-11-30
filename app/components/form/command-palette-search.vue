<script setup lang="ts">
const { placeholder, type, id, icon } = defineProps<{
  placeholder?: string
  type: string
  id?: string
  icon?: string
}>()
const modelValue = defineModel<OptionInput[]>()

const searchTerm = ref("")

const { data, status } = await useFetch<(OptionInput & { country?: CountryType })[]>(`/api/filter-search`, {
  query: { search: searchTerm, id, type },
  default: () => []
})

const groups = computed(() => [
  {
    id: "results",
    label: get(searchTerm) ? `${placeholder ?? `${type}s`} matching ${get(searchTerm)}` : placeholder ?? `${type}s`,
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
      <empty
        :message="`No ${placeholder?.toLowerCase() ?? `${type.toLowerCase()}s`} found`"
        class="mx-2"
      />
    </template>
  </u-command-palette>
</template>
