<script setup lang="ts">
definePageMeta({ name: "record" })
const {
  params: { id }
} = useRoute("record")
const playerStore = usePlayerStore()

// API call
const { data: results, status } = await useFetch<RecordType[]>("/api/player/record", {
  query: { id },
  default: () => []
})
</script>

<template>
  <u-container class="max-w-7xl">
    <u-page>
      <players-wrapper />

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
