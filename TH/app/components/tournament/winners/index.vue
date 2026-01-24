<script setup lang="ts">
const {
  params: { id }
} = useRoute("tournament")

const viewModeStore = useViewModeStore()

const tableRef = useTemplateRef("tableRef")
defineExpose({ tableRef })

// API call
const {
  data: editions,
  status,
  error
} = await useFetch("/api/editions", {
  query: { id },
  default: () => []
})

watch(
  error,
  () => {
    if (error.value) {
      if (error.value.statusMessage) {
        console.error(error.value.statusMessage, error.value.data?.data)
      } else {
        console.error(error.value)
      }
    }
  },
  { immediate: true }
)
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
