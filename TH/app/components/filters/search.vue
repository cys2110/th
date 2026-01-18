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

const {
  ui: { icons }
} = useAppConfig()

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

const handleClear = () => {
  set(modelValue, props.multiple ? [] : undefined)
  set(searchTerm, "")
}
</script>

<template>
  <u-input-menu
    v-model="modelValue"
    v-model:search-term="searchTerm"
    :multiple
    :items="data"
    :loading="status === 'pending'"
    :placeholder="`Select ${placeholder?.toLowerCase() ?? `${type.toLowerCase()}s`}`"
    :icon
    @update:open="onOpen"
    clear
  />
</template>
