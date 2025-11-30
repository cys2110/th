<script setup lang="ts">
import { EventsEntriesUpdate } from "#components"
import type { TableColumn } from "@nuxt/ui"
import { createColumnHelper } from "@tanstack/vue-table"

const {
  params: { edId, tour }
} = useRoute("event")
const {
  ui: { icons }
} = useAppConfig()
const refreshCount = defineModel<number>("refresh-count")

const {
  data: entries,
  status,
  refresh
} = await useFetch("/api/events/entries/players", {
  query: { edId, tour },
  default: () => []
})

watch(refreshCount, () => {
  refresh()
})

const columnHelper = createColumnHelper<PlayerEntryType>()

const columns: TableColumn<PlayerEntryType>[] = [
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
            return `${statusEnum[row.singles.status as keyof typeof statusEnum]} / Q-${statusEnum[row.singles.q_status as keyof typeof statusEnum]}`
          } else if (row.singles?.status) {
            return statusEnum[row.singles.status as keyof typeof statusEnum]
          } else if (row.singles?.q_status) {
            return `Q-${statusEnum[row.singles.q_status as keyof typeof statusEnum]}`
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
            return `${statusEnum[row.doubles.status as keyof typeof statusEnum]} / Q-${statusEnum[row.doubles.q_status as keyof typeof statusEnum]}`
          } else if (row.doubles?.status) {
            return statusEnum[row.doubles.status as keyof typeof statusEnum]
          } else if (row.doubles?.q_status) {
            return `Q-${statusEnum[row.doubles.q_status as keyof typeof statusEnum]}`
          }
        },
        header: "Status"
      },
      { accessorKey: "doubles.rank", header: "Rank" }
    ]
  })
]

const columnPinning = ref({
  left: ["player"],
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
      <u-icon
        :name="icons.loading"
        class="size-8"
      />
    </template>

    <template #empty>
      <empty
        message="No entries found"
        :icon="ICONS.noPeople"
        class="mx-2"
      >
        <dev-only>
          <events-entries-update :refresh="refresh" />
        </dev-only>
      </empty>
    </template>

    <template #player-cell="{ row }">
      <players-link
        v-if="row.original.country?.id"
        :player="row.original"
      />
      <u-link
        v-else
        :to="{ name: 'player', params: { id: row.original.id, name: '—' } }"
        class="hover-link default-link"
      >
        {{ row.original.id }}
      </u-link>
    </template>

    <template #singles_draws-cell="{ row }">
      <div
        v-if="row.original.singles"
        class="flex justify-center items-center gap-2"
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

    <template #singles_rank-cell="{ cell, row }">
      <dev-only>
        <events-entries-update
          v-if="row.original.singles?.draws?.length || row.original.singles?.withdrew"
          :entry="row.original.singles"
          :player="{ id: row.original.id, first_name: row.original.first_name, last_name: row.original.last_name, country: row.original.country! }"
          type="Singles"
          :refresh
          block
        >
          {{ cell.renderValue() }}
        </events-entries-update>
        <template v-else>{{ cell.renderValue() }}</template>
        <template #fallback>{{ cell.renderValue() }}</template>
      </dev-only>
    </template>

    <template #doubles_draws-cell="{ row }">
      <div
        v-if="row.original.doubles"
        class="flex justify-center items-center gap-2"
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

    <template #doubles_rank-cell="{ cell, row }">
      <dev-only>
        <events-entries-update
          v-if="row.original.doubles?.draws?.length || row.original.doubles?.withdrew"
          :entry="row.original.doubles"
          :player="{ id: row.original.id, first_name: row.original.first_name, last_name: row.original.last_name, country: row.original.country! }"
          type="Doubles"
          :refresh
          block
        >
          {{ cell.renderValue() }}
        </events-entries-update>
        <template v-else>{{ cell.renderValue() }}</template>
        <template #fallback>{{ cell.renderValue() }}</template>
      </dev-only>
    </template>
  </u-table>
</template>
