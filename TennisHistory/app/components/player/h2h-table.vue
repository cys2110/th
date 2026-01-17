<script setup lang="ts">
import type { ContextMenuItem, TableRow } from "@nuxt/ui"

const {
  params: { id, name }
} = useRoute("player")
const playerStore = usePlayerStore()
const toast = useToast()

const {
  data: h2hData,
  status,
  error
} = await useFetch("/api/player/h2h", {
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

const handleSelect = (e: Event, row: TableRow<PlayerH2HType>) => {
  toast.clear()

  const { opponent } = row.original

  toast.add({
    title: "Go to...",
    duration: Infinity,
    progress: false,
    actions: [
      {
        label: opponent.last_name ? `${opponent.first_name} ${opponent.last_name}` : opponent.id,
        icon: ICONS.player,
        to: {
          name: "player",
          params: { id: opponent.id, name: kebabCase(opponent.last_name ? `${opponent.first_name} ${opponent.last_name}` : opponent.id) }
        }
      },
      {
        label: "Head to Head",
        icon: ICONS.h2h,
        to: {
          name: "h2h",
          query: {
            team1: `${name}:${id}`,
            team2: `${opponent.last_name ? kebabCase(`${opponent.first_name} ${opponent.last_name}`) : opponent.id}:${opponent.id}`
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
    title="Most Frequent Head to Heads"
    :icon="ICONS.h2h"
  >
    <u-table
      :data="h2hData"
      :columns="playerH2HColumns"
      :loading="status === 'pending'"
      @select="handleSelect"
      :meta="{
        class: {
          tr: (row: TableRow<PlayerH2HType>) => (row.original.wins > row.original.losses ? 'bg-emerald-700/20' : 'bg-amber-700/20')
        }
      }"
    >
      <template #loading>
        <loading-icon />
      </template>
      <template #empty>
        <empty
          :message="`${playerStore.fullName} has not played any singles matches`"
          :icon="ICONS.h2hOff"
        />
      </template>
    </u-table>
  </dashboard-subpanel>
</template>
