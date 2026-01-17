<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"

const {
  params: { id }
} = useRoute("player")
const playerStore = usePlayerStore()
const router = useRouter()

const { data: editions, status } = await useFetch("/api/player/recent-events", {
  query: { id },
  default: () => []
})

const handleSelectRow = (_e: Event, row: TableRow<PlayerRecentEventType>) => {
  const { tournament, year, id } = row.original

  router.push({
    name: "edition",
    params: {
      id: tournament.id,
      name: kebabCase(tournament.name),
      year: year.toString(),
      edId: id.toString()
    }
  })
}
</script>

<template>
  <dashboard-subpanel
    title="Most Recent Events Played"
    :icon="ICONS.years"
    class="lg:col-span-2"
  >
    <u-table
      :data="editions"
      :columns="recentEventColumns"
      :loading="status === 'pending'"
      @select="handleSelectRow"
      :meta="{
        class: {
          tr: (row: TableRow<PlayerRecentEventType>) => row.original.title ? 'bg-emerald-700/20' : ''
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
