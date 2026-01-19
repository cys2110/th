<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    type: string
    multiple?: boolean
    icon?: string
    placeholder?: string
  }>(),
  {
    multiple: false,
    icon: "line-md:filter-twotone"
  }
)

const modelValue = defineModel<OptionType | OptionType[]>()

const searchTerm = ref("")

const { data, status, execute } = await useLazyFetch<(OptionType & { icon?: CountryType })[]>("/api/filter-search", {
  query: { search: searchTerm, type: props.type },
  default: () => [],
  immediate: false,
  transform: (data: any) =>
    data.map((item: any) => {
      if (item.country) {
        return {
          ...item,
          icon: getFlagCode(item.country)
        }
      }
      return item
    })
})

const onOpen = () => {
  if (!get(data).length) {
    execute()
  }
}
</script>

<template>
  <u-input-menu
    :placeholder="`Select ${placeholder?.toLowerCase() ?? `${type.toLowerCase()}s`}`"
    clear
    :items="data"
    v-model="modelValue"
    :multiple
    @update:open="onOpen"
    :icon
    :loading="status === 'pending'"
    v-model:search-term="searchTerm"
  />
</template>
