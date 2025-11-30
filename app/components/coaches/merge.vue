<script setup lang="ts">
import type { TableColumn, TableRow } from "@nuxt/ui"

const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()

interface CoachInterface {
  coach: string
  player: string
  player_name: string
  coached_players: string[]
}

const { data, status, refresh } = await useFetch("/api/coaches/merge", {
  default: () => []
})

const columns: TableColumn<CoachInterface>[] = [
  { accessorKey: "coach", header: "Coach" },
  { accessorKey: "coached_players", header: "Coached Players" },
  { accessorKey: "player", header: "Player" },
  { accessorKey: "player_name", header: "Player Name" }
]

const handleMerge = async (id1: string, id2: string) => {
  try {
    await $fetch("/api/merge", {
      query: { type: "Coach", id1, id2 }
    })
    toast.add({
      title: `Nodes merged`,
      icon: icons.success,
      color: "success"
    })
  } catch (e: any) {
    toast.add({
      title: `Error merging nodes`,
      description: e,
      icon: icons.error,
      color: "error"
    })
  }
}

const handleSelect = (e: Event, row: TableRow<CoachInterface>) => {
  const { coach, player } = row.original
  handleMerge(coach, player)
  refresh()
}
</script>

<template>
  <u-modal title="Merge Coaches">
    <u-button
      :icon="ICONS.merge"
      label="Merge Coaches"
      block
    />

    <template #body>
      <u-table
        ref="table"
        :data
        :columns
        :loading="status === 'pending'"
        sticky
        @select="handleSelect"
        render-fallback-value="—"
        :ui="{ tbody: '[&>tr]:cursor-pointer', root: 'max-h-150' }"
      >
        <template #loading>
          <u-icon
            :name="icons.loading"
            class="size-8"
          />
        </template>
        <template #empty>
          <empty
            message="No coaches to merge"
            class="mx-2"
          />
        </template>
      </u-table>
    </template>
  </u-modal>
</template>
