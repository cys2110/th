<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    placeholder?: string
    type: string
    icon?: string
    multiple?: boolean
  }>(),
  {
    multiple: false
  }
)

const searchTerm = ref("")
const modelValue = defineModel<OptionType[] | OptionType>()

const { data, status, refresh } = await useFetch<OptionType[] & { icon?: CountryType }>(`/api/filter-search`, {
  query: {
    search: searchTerm,
    type: props.type
  },
  default: () => [],
  transform: data => {
    return data.map(item => {
      // @ts-expect-error
      if (item.country) {
        return {
          ...item,
          // @ts-expect-error
          icon: getFlagCode(item.country)
        }
      }
      return item
    })
  }
})
</script>

<template>
  <u-input-menu
    :placeholder="`Select ${placeholder?.toLowerCase() ?? `${type.toLowerCase()}s`}`"
    clear
    :items="data"
    v-model="modelValue"
    :multiple
    :icon
    :loading="status === 'pending'"
    v-model:search-term="searchTerm"
  >
    <template #content-bottom>
      <dev-only>
        <venue-update
          v-if="type === 'Venue'"
          :refresh
        />
        <person-update
          v-else-if="['Supervisor', 'Coach', 'Umpire'].includes(type)"
          :type="<'Supervisor' | 'Coach' | 'Umpire'>type"
          :refresh
        />
      </dev-only>
    </template>
  </u-input-menu>
</template>
