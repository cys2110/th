<script setup lang="ts">
const props = defineProps<{
  placeholder: string
  icon?: string
  startValue?:
    | {
        id: string
        label: string
      }
    | undefined
}>()

const { results, loading, refresh, searchTerm } = usePersonSearch()

const modelValue = defineModel<string>()

const selectedPerson = ref(props.startValue)

watch(selectedPerson, newPerson => (modelValue.value = newPerson?.id))
</script>

<template>
  <u-input-menu
    v-model="selectedPerson"
    v-model:search-term="searchTerm"
    :loading="loading"
    clear
    :placeholder
    :icon
    :items="results"
    class="w-full"
  >
    <template #content-bottom>
      <person-create @refresh="refresh" />
    </template>
  </u-input-menu>
</template>
