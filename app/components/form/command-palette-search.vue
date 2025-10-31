<script setup lang="ts">
const { type, id } = defineProps<{ type: string; id?: string }>()
const modelValue = defineModel<SelectOptionsType[]>()

const searchTerm = ref("")

const { data, status } = await useFetch<SelectOptionsType[]>(`/api/${type.toLowerCase()}/search`, {
  query: { search: searchTerm, id },
  default: () => []
})

const groups = computed(() => [
  {
    id: "results",
    label: get(searchTerm) ? `${type} matching ${get(searchTerm)}` : type,
    items:
      get(data).map(item => ({
        ...item,
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
    :placeholder="`Search ${type.toLowerCase()}`"
  />
</template>
