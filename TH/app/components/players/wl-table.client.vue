<script setup lang="ts">
const {
  params: { id }
} = useRoute("player")
const playerStore = usePlayerStore()

const { data: wlData, status } = await useFetch("/api/player/wl", {
  query: { id },
  default: () => [],
  server: false
})
</script>

<template>
  <dashboard-subpanel
    title="Win-Loss"
    :icon="ICONS.stats"
  >
    <u-table
      :data="wlData"
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
