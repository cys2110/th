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

const {
  ui: { icons }
} = useAppConfig()

const searchTerm = ref("")
const modelValue = defineModel<OptionType[] | OptionType>()

const { data, status, refresh } = await useFetch<OptionType[] & { icon?: CountryType }>(`/api/filter-search`, {
  query: { search: searchTerm },
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

const handleClear = () => {
  modelValue.value = props.multiple ? [] : undefined
  searchTerm.value = ""
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
  >
    <template #content-bottom>
      <u-field-group>
        <dev-only>
          <person-update
            v-if="['Supervisor', 'Coach', 'Umpire'].includes(type)"
            :type="(type as 'Supervisor' | 'Coach' | 'Umpire')"
            :refresh
          />
        </dev-only>
        <!-- <dev-only>
          <venues-update
            v-if="type === 'Venue'"
            :refresh
          />
        </dev-only> -->
        <u-button
          label="Clear"
          @click="handleClear"
          :icon="icons.close"
          block
          class="rounded-t-none"
        />
      </u-field-group>
    </template>
  </u-input-menu>
</template>
