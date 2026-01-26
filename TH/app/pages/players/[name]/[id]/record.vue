<script setup lang="ts">
definePageMeta({ name: "record" })

const {
  params: { id }
} = useRoute("record")

const { devMode } = useRuntimeConfig().public

const playerStore = usePlayerStore()

// API call
const { data, status, error } = await useFetch<{ statusObjects: string[]; results: RecordType[] }>("/api/player/record", {
  query: { id },
  default: () => ({ statusObjects: [], results: [] })
})

watch(
  () => data.value.statusObjects,
  () => {
    if (data.value?.statusObjects.length && devMode) {
      console.info(`${playerStore.fullName} Record API Status Objects:`, data.value.statusObjects)
    }
  },
  { immediate: true }
)

watch(
  error,
  newError => {
    if (newError) {
      if (newError.statusMessage) {
        console.error(newError.statusMessage, newError.data?.data)
      } else {
        console.error(newError)
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
        <api-alerts :error />

        <u-table
          :data="data.results"
          :columns="playerRecordColumns()"
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
