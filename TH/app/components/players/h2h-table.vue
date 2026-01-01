<script setup lang="ts">


import type { ContextMenuItem, TableRow } from "@nuxt/ui"

const {
  params: { id }
} = useRoute("player")
const playerStore = usePlayerStore()
const router = useRouter()

const { data: h2hData, status } = await useFetch("/api/player/h2h", {
  query: { id },
  default: () => []
})

const items = ref<ContextMenuItem[]>([])

const getRowItems = (row: TableRow<PlayerH2HType>) => {
  const { opponent } = row.original

  return [
    {
      type: "label" as const,
      label: "Go to..."
    },
    {
      label: opponent.last_name ? `${opponent.first_name} ${opponent.last_name}` : opponent.id,
      icon: ICONS.player,
      to: {
        name: "player",
        params: {
          id: opponent.id,
          name: opponent.last_name ? kebabCase(`${opponent.first_name} ${opponent.last_name}`) : opponent.id
        }
      },
      target: opponent.last_name ? "_self" : "_blank"
    },
    {
      label: "Head to Head",
      icon: ICONS.h2h,
      to: {
        name: "h2h",
        query: {
          team1: id,
          team2: opponent.id
        }
      }
    }
  ] as ContextMenuItem[]
}

const onContextmenu = (e: Event, row: TableRow<PlayerH2HType>) => {
  items.value = getRowItems(row)
}

const handleSelect = (e: Event, row: TableRow<PlayerH2HType>) => {
  router.push({
    name: "h2h",
    query: {
      team1: id,
      team2: row.original.opponent.id
    }
  })
}
</script>

<template>
  <dashboard-subpanel
    title="Most Frequent Head to Heads"
    :icon="ICONS.h2h"
  >
    <u-context-menu :items>
      <u-table
        :data="h2hData"
        :columns="playerH2HColumns"
        :loading="status === 'pending'"
        @select="handleSelect"
        @contextmenu="onContextmenu"
        :meta="{
          class: {
            tr: (row: TableRow<PlayerH2HType>) => row.original.wins > row.original.losses ? 'bg-emerald-700/20' : 'bg-amber-700/20'
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
    </u-context-menu>
  </dashboard-subpanel>
</template>
