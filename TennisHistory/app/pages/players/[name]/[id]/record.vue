<script setup lang="ts">
definePageMeta({ name: "record" })
const {
  params: { id }
} = useRoute("record")

// API call
const { data: results, status } = await useFetch<RecordType[]>("/api/players/record", {
  query: { id },
  default: () => []
})

const tour = computed(() => (isNaN(Number(id)) ? "ATP" : "WTA"))
</script>

<template>
  <u-container class="max-w-7xl">
    <u-page>
      <players-wrapper />

      <u-page-body>
        <u-table
          :data="results"
          :columns="recordColumns(tour)"
          :loading="status === 'pending'"
          sticky
          render-fallback-value="—"
        >
          <template #loading>
            <loading-icon />
          </template>
          <template #empty>
            <empty
              message="No record available"
              class="mx-2"
            />
          </template>
        </u-table>
      </u-page-body>
    </u-page>
  </u-container>
</template>
