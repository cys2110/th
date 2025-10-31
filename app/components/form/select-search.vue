<script setup lang="ts">
const { type, id, tour, matchType } = defineProps<{
  placeholder?: string
  type: string
  block?: boolean
  icon?: string
  size?: "md"
  multiple?: boolean
  id?: string
  tour?: keyof typeof TourEnum
  matchType?: MatchType
}>()
const {
  ui: { icons }
} = useAppConfig()

const searchTerm = ref("")
const modelValue = defineModel<SelectOptionsType[] | SelectOptionsType>()

const { data, status } = await useFetch(`/api/${type.toLowerCase()}/search`, {
  query: { search: searchTerm, id, tour, matchType },
  default: () => []
})
</script>

<template>
  <u-input-menu
    v-model="modelValue"
    v-model:search-term="searchTerm"
    :multiple
    :items="data"
    :loading="status === 'pending'"
    :placeholder
    :variant="block ? undefined : 'none'"
    :class="{ 'w-fit max-w-50': !block }"
    :icon
    :size
  >
    <template #content-bottom>
      <u-field-group>
        <venues-update v-if="type === 'venues'" />
        <person-update
          v-else-if="['supervisors', 'umpires', 'coaches'].includes(type)"
          :type="type === 'supervisors' ? 'Supervisor' : type === 'coaches' ? 'Coach' : 'Umpire'"
        />
        <u-button
          label="Clear"
          size="xs"
          @click="Array.isArray(modelValue) ? (modelValue = []) : (modelValue = undefined)"
          :icon="icons.close"
          block
          class="rounded-t-none"
        />
      </u-field-group>
    </template>
  </u-input-menu>
</template>
