<script setup lang="ts">
const {
  params: { id }
} = useRoute("tournament")
const viewModeStore = useViewModeStore()

const tableRef = useTemplateRef("tableRef")
defineExpose({ tableRef })

// API call
const { data: editions, status } = await useFetch("/api/editions", {
  query: { id },
  default: () => [],
  onResponseError: ({ error }) => console.error(error)
})
</script>

<template>
  <tournament-winners-grid
    v-if="viewModeStore.isCardView"
    :editions
    :status
  />

  <tournament-winners-table
    v-else
    ref="tableRef"
    :editions
    :status
  />
</template>
