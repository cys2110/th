<script setup lang="ts">
/**
 * A search filter component that fetches and displays options based on user input.
 * @prop type - The type of options to search for (e.g., players, countries).
 * @prop multiple - Whether multiple selections are allowed.
 * @prop icon - Optional icon to display in the input menu.
 * @prop placeholder - Optional placeholder text for the input menu.
 * @model modelValue - Two-way bound model for selected options.
 */

const props = withDefaults(
  defineProps<{
    type: string
    multiple?: boolean
    icon?: string
    placeholder?: string
  }>(),
  {
    multiple: false
  }
)

const {
  ui: { icons }
} = useAppConfig()

const searchTerm = ref("")
const modelValue = defineModel<OptionType | OptionType[]>()

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
