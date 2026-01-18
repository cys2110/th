<script setup lang="ts">
definePageMeta({ name: "record" })
const {
  params: { id }
} = useRoute("record")
const playerStore = usePlayerStore()

// API call
const {
  data: results,
  status,
  error
} = await useFetch<RecordType[]>("/api/player/record", {
  query: { id },
  default: () => []
})

watch(
  error,
  () => {
    if (error.value) {
      if (error.value.statusMessage === "Validation errors") {
        console.error(error.value.statusMessage, error.value.data?.data.validationErrors)
      } else {
        console.error(error.value)
      }
    }
  },
  { immediate: true }
)
</script>

<template>
  <u-container class="max-w-7xl">
    <u-page>
      <player-wrapper />

      <u-page-body>
        <u-table
          :data="results"
          :columns="playerRecordColumns(playerStore.tour || 'ATP')"
          :loading="status === 'pending'"
          sticky
          render-fallback-value="—"
          :ui="{ th: 'text-center py-1', td: 'text-center' }"
        >
          <template #loading>
            <loading-icon />
          </template>
          <template #empty>
            <empty :message="`No record available for ${playerStore.fullName}`" />
          </template>
        </u-table>
      </u-page-body>
    </u-page>
  </u-container>
</template>
