<script setup lang="ts">
const props = defineProps<{
  type: string
  icon?: string
  placeholder?: string
}>()

const modelValue = defineModel<OptionType[]>()

const searchTerm = ref("")

const { data, status, error } = await useLazyFetch<(OptionType & { country?: CountryType })[]>("/api/filter-search", {
  query: { search: searchTerm, type: props.type },
  default: () => []
})

watch(error, () => {
  if (error.value) {
    if (error.value.statusMessage) {
      console.error(error.value.statusMessage, error.value.data?.data)
    } else {
      console.error(error.value)
    }
  }
})

const groups = computed(() => [
  {
    id: "results",
    label: get(searchTerm) ? `${props.placeholder ?? `${props.type}s`} matching ${get(searchTerm)}` : (props.placeholder ?? `${props.type}s`),
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
    :icon
    :placeholder="`Search ${placeholder?.toLowerCase() ?? `${type.toLowerCase()}s`}`"
    :groups
    :fuse="{ resultLimit: 22 }"
    multiple
    :loading="status === 'pending'"
    v-model:search-term="searchTerm"
  >
    <template #empty>
      <empty :message="`No ${placeholder?.toLowerCase() ?? `${type.toLowerCase()}s`} found`" />
    </template>
  </u-command-palette>
</template>
