<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"

defineProps<{ refresh: number }>()
const {
  params: { edId, tour }
} = useRoute("event")
const { devMode } = useRuntimeConfig().public

const {
  data: entries,
  status,
  refresh
} = await useFetch<EntryInterface[]>("/api/events/entries/teams", {
  query: { edId, tour },
  default: () => []
})

watch(
  () => refresh,
  () => {
    refresh()
  }
)

const columns: TableColumn<EntryInterface>[] = [
  { accessorKey: "team", header: "Team" },
  { accessorKey: "type", header: "S/D" },
  { accessorKey: "draws", header: "Draws" },
  { id: "seed", accessorFn: row => row.seed ?? (row.q_seed ? `Q-${row.q_seed}` : undefined), header: "Seed" },
  {
    id: "status",
    accessorFn: row => {
      if (row.status && row.q_status) {
        return `${StatusEnum[row.status]} / Q-${StatusEnum[row.q_status]}`
      } else if (row.status) {
        return StatusEnum[row.status]
      } else if (row.q_status) {
        return `Q-${StatusEnum[row.q_status]}`
      }
    },
    header: "Status"
  },
  { id: "rank", accessorFn: row => row.team.reduce((sum, player) => sum + (player.rank || 0), 0), header: "Rank" }
]
</script>

<template>
  <u-table
    :data="entries"
    :columns
    :loading="status === 'pending'"
    sticky
    render-fallback-value="—"
    class="max-h-150"
  >
    <template #loading>
      <table-loading />
    </template>

    <template #empty>
      <u-empty
        title="No entries found"
        :icon="ICONS.noPeople"
      >
        <template
          #actions
          v-if="devMode"
        >
          <events-entries-update :refresh />
        </template>
      </u-empty>
    </template>

    <template #team-cell="{ row }">
      <players-link
        v-for="player in row.original.team"
        :key="player.id"
        :player
      />
    </template>

    <template #type-cell="{ row }">
      <u-badge
        :label="row.original.type"
        :color="row.original.type"
      />
    </template>

    <template #draws-cell="{ row }">
      <div class="flex justify-center items-center gap-2">
        <u-badge
          v-for="draw in row.original.draws"
          :key="draw"
          :label="draw"
          :color="draw"
        />
      </div>
    </template>

    <template #rank-cell="{ cell }">
      {{ cell.getValue() || "—" }}
    </template>
  </u-table>
</template>
