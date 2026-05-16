<script setup lang="ts">
withDefaults(defineProps<{ multiple?: boolean }>(), { multiple: false })

const { results, loading, searchTerm } = usePlayerSearch()

const modelValue = defineModel<any>()
</script>

<template>
  <u-input-menu
    v-model="modelValue"
    v-model:search-term="searchTerm"
    :loading="loading"
    clear
    placeholder="Select player"
    :icon="ICONS.player"
    :items="results"
    class="w-full"
    :multiple
  />
</template>
