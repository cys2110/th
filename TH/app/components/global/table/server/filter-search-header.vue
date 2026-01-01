<script setup lang="ts">
/**
 * Header component for filterable table columns where server-side filtering is applied.
 * @prop label - Label for the filter header.
 * @prop type - Type of filter (e.g., "Player", "Country").
 * @prop multiple - Whether multiple selections are allowed.
 * @model modelValue - Two-way bound model for selected filter options.
 */

const props = withDefaults(
  defineProps<{
    label: string
    type: string
    multiple?: boolean
  }>(),
  {
    multiple: false
  }
)

const searchTerm = ref("")
const modelValue = defineModel<OptionType | OptionType[]>()

const {
  ui: { icons }
} = useAppConfig()

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
    :placeholder="label"
    :loading="status === 'pending'"
    :items="data"
    variant="none"
    :icon="ICONS.filter"
    class="min-w-30"
    :multiple="multiple"
  >
    <template #content-bottom>
      <u-button
        label="Clear"
        @click="handleClear"
        :icon="icons.close"
        block
        class="rounded-t-none"
      />
    </template>
  </u-input-menu>
</template>
