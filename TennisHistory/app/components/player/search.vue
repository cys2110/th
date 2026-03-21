<script setup lang="ts">
const props = defineProps<{
  startValue?: {
    id: string
    label: string
  }
}>()

const { results, loading, searchTerm } = usePlayerSearch()

const modelValue = defineModel<string>()

const selectedPlayer = ref(props.startValue)

watch(selectedPlayer, newPerson => (modelValue.value = newPerson?.id))
</script>

<template>
  <u-select-menu
    v-model="selectedPlayer"
    v-model:search-term="searchTerm"
    :loading="loading"
    clear
    placeholder="Select player"
    :icon="ICONS.player"
    :items="results"
  />
</template>
