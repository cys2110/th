<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"

const {
  params: { id, name }
} = useRoute("player")
const router = useRouter()

const { devMode } = useRuntimeConfig().public

const playerStore = usePlayerStore()

const { data, status, error } = await useFetch("/api/player/h2h", {
  query: { id },
  default: () => ({ statusObjects: [], results: [] as PlayerH2HType[] })
})

watch(
  () => data.value.statusObjects,
  () => {
    if (data.value?.statusObjects.length && devMode) {
      console.info(`${playerStore.fullName} head-to-head API Status Objects:`, data.value.statusObjects)
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

const handleSelectRow = (_e: Event, row: TableRow<PlayerH2HType>) => {
  const { opponent } = row.original

  router.push({
    name: "h2h",
    query: {
      team1: `${name}:${id}`,
      team2: `${opponent.last_name ? kebabCase(`${opponent.first_name} ${opponent.last_name}`) : opponent.id}:${opponent.id}`
    }
  })
}
</script>

<template>
  <dashboard-subpanel
    id="h2h"
    title="Most Frequent Head to Heads"
    :icon="ICONS.h2h"
    class="scroll-mt-70"
  >
    <u-table
      :data="data.results"
      :columns="playerH2HColumns"
      :meta="{
        class: {
          tr: (row: TableRow<PlayerH2HType>) => (row.original.wins > row.original.losses ? 'bg-emerald-700/20' : 'bg-amber-700/20')
        }
      }"
      :loading="status === 'pending'"
      @select="handleSelectRow"
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
