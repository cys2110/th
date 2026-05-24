<script setup lang="ts">
const props = defineProps<{
  placeholder: string
  icon?: string
  startValue?:
    | {
        id: string
        full_name: string
      }
    | undefined
}>()

const { results, pending, fetchSearchResults, searchTerm } = usePersonSearch()

const modelValue = defineModel<any>()
</script>

<template>
  <u-input-menu
    v-model="modelValue"
    v-model:search-term="searchTerm"
    @update:open="fetchSearchResults"
    :loading="pending"
    clear
    :placeholder
    :icon
    :items="results"
    class="w-full"
    label-key="full_name"
  >
    <template #content-bottom>
      <person-create @refresh="fetchSearchResults" />
    </template>
  </u-input-menu>
</template>
