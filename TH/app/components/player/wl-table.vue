<script setup lang="ts">
const {
  params: { id }
} = useRoute("player")

const { devMode } = useRuntimeConfig().public

const playerStore = usePlayerStore()

const { data, status, error } = await useFetch("/api/player/wl", {
  query: { id },
  default: () => ({ statusObjects: [], results: [] as wlType[] })
})

watch(
  () => data.value.statusObjects,
  () => {
    if (data.value?.statusObjects.length && devMode) {
      console.info(`${playerStore.fullName} win-loss API Status Objects:`, data.value.statusObjects)
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
  <dashboard-subpanel
    id="wl"
    title="Win-Loss"
    :icon="ICONS.stats"
    class="scroll-mt-70"
  >
    <u-table
      :data="data.results"
      :columns="playerWLColumns"
      :loading="status === 'pending'"
      :ui="{ th: 'py-1 text-center', td: 'text-center' }"
    >
      <template #loading>
        <loading-icon />
      </template>
      <template #empty>
        <empty :message="`${playerStore.fullName} has not played any matches`" />
      </template>
    </u-table>
  </dashboard-subpanel>
</template>
