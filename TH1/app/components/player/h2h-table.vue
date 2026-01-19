<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"

const {
  params: { id, name }
} = useRoute("player")
const router = useRouter()
const playerStore = usePlayerStore()

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
      :data="h2hData"
      :columns="playerH2HColumns"
      :loading="status === 'pending'"
      @select="handleSelectRow"
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
