<script setup lang="ts">
const { index, status } = defineProps<{
  index: WLIndexInterface[]
  status: APIStatusType
  first_name: string
  last_name: string
}>()
const { tableMode } = useDefaultTable()
</script>

<template>
  <player-wl-index-table-grouped
    v-if="tableMode === 'grouped'"
    :index
    :status
    :first_name
    :last_name
  />

  <player-wl-index-table-ungrouped
    v-else
    :index
    :status
    :first_name
    :last_name
  />
</template>
