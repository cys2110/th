<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"

const {
  params: { id }
} = useRoute("player")
const router = useRouter()

const { devMode } = useRuntimeConfig().public

const playerStore = usePlayerStore()

const { data, status, error } = await useFetch("/api/player/recent-events", {
  query: { id },
  default: () => ({ statusObjects: [], results: [] })
})

watch(
  () => data.value.statusObjects,
  () => {
    if (data.value?.statusObjects.length && devMode) {
      console.info(`${playerStore.fullName} recent events API Status Objects:`, data.value.statusObjects)
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

const handleSelectRow = (_e: Event, row: TableRow<PlayerRecentEventType>) => {
  const { tournament, year, id } = row.original

  router.push({
    name: "edition",
    params: {
      id: tournament.id,
      name: kebabCase(tournament.name),
      year,
      edId: id
    }
  })
}
</script>

<template>
  <dashboard-subpanel
    id="recent-events"
    title="Most Recent Events Played"
    :icon="ICONS.racquet"
    class="lg:col-span-2 scroll-mt-70"
  >
    <api-alerts :error />

    <u-table
      :data="data.results"
      :columns="recentEventColumns"
      :meta="{
        class: {
          tr: (row: TableRow<PlayerRecentEventType>) => (row.original.title ? 'bg-emerald-700/20' : '')
        }
      }"
      :loading="status === 'pending'"
      @select="handleSelectRow"
      :ui="{ th: 'text-center', td: 'text-center' }"
    >
      <template #loading>
        <loading-icon />
      </template>
      <template #empty>
        <empty
          :message="`${playerStore.fullName} has not played in any events yet.`"
          :icon="ICONS.h2hOff"
        />
      </template>
    </u-table>
  </dashboard-subpanel>
</template>
