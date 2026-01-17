<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"

const {
  params: { id }
} = useRoute("player")
const playerStore = usePlayerStore()
const toast = useToast()

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
  toast.clear()
  const { tournament, year, id } = row.original

  toast.add({
    title: "Go to...",
    duration: Infinity,
    progress: false,
    actions: [
      {
        label: tournament.name,
        icon: ICONS.trophy,
        to: {
          name: "tournament",
          params: {
            id: tournament.id,
            name: kebabCase(tournament.name)
          }
        }
      },
      {
        label: year.toString(),
        icon: ICONS.calendar,
        to: {
          name: "edition",
          params: {
            id: tournament.id,
            name: kebabCase(tournament.name),
            year: year.toString(),
            edId: id.toString()
          }
        }
      }
    ]
  })
}

onUnmounted(() => {
  toast.clear()
})
onBeforeRouteLeave(() => {
  toast.clear()
})
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
