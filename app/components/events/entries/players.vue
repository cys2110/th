<script setup lang="ts">
import { EventsEntriesUpdate } from "#components"
import type { TableColumn } from "@nuxt/ui"
import { createColumnHelper } from "@tanstack/vue-table"

defineProps<{ refresh: number }>()
const {
  params: { edId, tour }
} = useRoute("event")
const { devMode } = useRuntimeConfig().public
const overlay = useOverlay()
const editEntry = overlay.create(EventsEntriesUpdate)

const {
  data: entries,
  status,
  refresh
} = await useFetch<EntryByPlayerInterface[]>("/api/events/entries/players", {
  query: { edId, tour },
  default: () => []
})

watch(
  () => refresh,
  () => {
    refresh()
  }
)

const columnHelper = createColumnHelper<EntryByPlayerInterface>()

const columns: TableColumn<EntryByPlayerInterface>[] = [
  { id: "player", header: "Player" },
  columnHelper.group({
    header: "Singles",
    columns: [
      { accessorKey: "singles.draws", header: "Draws" },
      { id: "singles_seed", accessorFn: row => row.singles?.seed ?? (row.singles?.q_seed ? `Q-${row.singles.q_seed}` : undefined), header: "Seed" },
      {
        id: "singles_status",
        accessorFn: row => {
          if (row.singles?.status && row.singles?.q_status) {
            return `${StatusEnum[row.singles.status]} / Q-${StatusEnum[row.singles.q_status]}`
          } else if (row.singles?.status) {
            return StatusEnum[row.singles.status]
          } else if (row.singles?.q_status) {
            return `Q-${StatusEnum[row.singles.q_status]}`
          }
        },
        header: "Status"
      },
      { accessorKey: "singles.rank", header: "Rank" }
    ]
  }),
  columnHelper.group({
    header: "Doubles",
    columns: [
      { accessorKey: "doubles.draws", header: "Draws" },
      { id: "doubles_seed", accessorFn: row => row.doubles?.seed ?? (row.doubles?.q_seed ? `Q-${row.doubles.q_seed}` : undefined), header: "Seed" },
      {
        id: "doubles_status",
        accessorFn: row => {
          if (row.doubles?.status && row.doubles?.q_status) {
            return `${StatusEnum[row.doubles.status]} / Q-${StatusEnum[row.doubles.q_status]}`
          } else if (row.doubles?.status) {
            return StatusEnum[row.doubles.status]
          } else if (row.doubles?.q_status) {
            return `Q-${StatusEnum[row.doubles.q_status]}`
          }
        },
        header: "Status"
      },
      { accessorKey: "doubles.rank", header: "Rank" }
    ]
  })
]

const handleEditEntry = (entry: EntryByPlayerInterface["singles"], player: Partial<PersonInterface>, type: MatchType) => {
  editEntry.open({ entry, player, type, refresh })
}
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

    <template #player-cell="{ row }">
      <players-link :player="row.original" />
    </template>

    <template #singles_draws-cell="{ row }">
      <div
        v-if="row.original.singles"
        class="flex justify-center items-center gap-2"
        @click="
          devMode
            ? handleEditEntry(
                row.original.singles,
                { id: row.original.id, first_name: row.original.first_name, last_name: row.original.last_name, country: row.original.country },
                'Singles'
              )
            : undefined
        "
        :class="{ 'cursor-pointer': devMode }"
      >
        <u-badge
          v-for="draw in row.original.singles.draws"
          :key="draw"
          :label="draw"
          :color="draw"
        />
      </div>
      <template v-else>—</template>
    </template>

    <template #singles_rank-cell="{ cell }">
      {{ cell.renderValue() }}
    </template>

    <template #doubles_draws-cell="{ row }">
      <div
        v-if="row.original.doubles"
        class="flex justify-center items-center gap-2"
        @click="
          devMode
            ? handleEditEntry(
                row.original.doubles,
                { id: row.original.id, first_name: row.original.first_name, last_name: row.original.last_name, country: row.original.country },
                'Doubles'
              )
            : undefined
        "
        :class="{ 'cursor-pointer': devMode }"
      >
        <u-badge
          v-for="draw in row.original.doubles.draws"
          :key="draw"
          :label="draw"
          :color="draw"
        />
      </div>
      <template v-else>—</template>
    </template>

    <template #doubles_rank-cell="{ cell }">
      {{ cell.renderValue() }}
    </template>
  </u-table>
</template>
