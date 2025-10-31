<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"

const {
  params: { edId, tour }
} = useRoute("event")
const {
  ui: { icons }
} = useAppConfig()

const {
  data: entries,
  status,
  refresh
} = await useFetch<EntryInterface[]>("/api/events/entries/teams", {
  query: { edId, tour },
  default: () => []
})

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
  { id: "rank", accessorFn: row => row.team.reduce((sum, player) => sum + (player.rank || 0), 0), header: "Rank", cell: cell => cell.renderValue() }
]

const columnPinning = ref({
  left: ["team"],
  right: []
})
</script>

<template>
  <u-table
    :data="entries"
    :columns
    :loading="status === 'pending'"
    sticky
    render-fallback-value="—"
    v-model:column-pinning="columnPinning"
    class="max-h-150"
  >
    <template #loading>
      <table-loading />
    </template>

    <template #empty>
      <u-empty
        title="No entries found"
        :icon="ICONS.noPeople"
        description="If you think this is an error, refresh the page. Otherwise, please be patient as we continue to add more data."
        class="mx-2"
      >
        <template #actions>
          <u-button
            :icon="icons.reload"
            label="Refresh"
            @click="() => reloadNuxtApp()"
          />
          <dev-only>
            <events-entries-update :refresh />
          </dev-only>
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
  </u-table>
</template>
