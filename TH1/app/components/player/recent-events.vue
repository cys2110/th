<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"

const {
  params: { id }
} = useRoute("player")
const router = useRouter()
const playerStore = usePlayerStore()

const {
  data: editions,
  status,
  error
} = await useFetch("/api/player/recent-events", {
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
    <u-table
      :data="editions"
      :columns="recentEventColumns"
      :loading="status === 'pending'"
      @select="handleSelectRow"
      :meta="{
        class: {
          tr: (row: TableRow<PlayerRecentEventType>) => (row.original.title ? 'bg-emerald-700/20' : '')
        }
      }"
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
