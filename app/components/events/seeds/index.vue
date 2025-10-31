<script setup lang="ts">
import { EventsSeedsUpdate } from "#components"
import type { TableColumn } from "@nuxt/ui"
import { createColumnHelper } from "@tanstack/vue-table"

const {
  params: { edId, tour }
} = useRoute("event")
const {
  ui: { icons }
} = useAppConfig()
const overlay = useOverlay()
const editSeed = overlay.create(EventsSeedsUpdate)

const {
  data: seeds,
  status,
  refresh
} = await useFetch<EntryInterface[]>("/api/events/seeds", {
  query: { edId, tour },
  default: () => []
})

const consolidatedSeeds = computed(() => {
  const uniqueSeeds = useSorted(useArrayUnique(seeds.value.map(s => s.seed))).value

  return uniqueSeeds.map(seedNumber => {
    const mainSingles = seeds.value.find(s => s.seed === seedNumber && s.type === "Singles" && s.draw === "Main")
    const qualSingles = seeds.value.find(s => s.seed === seedNumber && s.type === "Singles" && s.draw === "Qualifying")
    const mainDoubles = seeds.value.find(s => s.seed === seedNumber && s.type === "Doubles" && s.draw === "Main")
    const qualDoubles = seeds.value.find(s => s.seed === seedNumber && s.type === "Doubles" && s.draw === "Qualifying")

    return {
      seed: seedNumber,
      mainSinglesTeam: {
        withdrew: mainSingles?.withdrew ?? false,
        players: mainSingles?.team ?? []
      },
      mainSinglesRank: mainSingles?.rank ?? null,
      qualSinglesTeam: {
        withdrew: qualSingles?.withdrew ?? false,
        players: qualSingles?.team ?? []
      },
      qualSinglesRank: qualSingles?.rank ?? null,
      mainDoublesTeam: {
        withdrew: mainDoubles?.withdrew ?? false,
        players: mainDoubles?.team ?? []
      },
      mainDoublesRank: mainDoubles?.rank ?? null,
      qualDoublesTeam: {
        withdrew: qualDoubles?.withdrew ?? false,
        players: qualDoubles?.team ?? []
      },
      qualDoublesRank: qualDoubles?.rank ?? null
    }
  })
})

type ConsolidatedSeed = (typeof consolidatedSeeds.value)[number]

const columnHelper = createColumnHelper<ConsolidatedSeed>()

const columns: TableColumn<ConsolidatedSeed>[] = [
  { accessorKey: "seed", header: "Seed" },
  columnHelper.group({
    header: "Singles",
    columns: [
      columnHelper.group({
        header: "Main",
        columns: [
          { accessorKey: "mainSinglesTeam", header: "Player" },
          { accessorKey: "mainSinglesRank", header: "Rank" }
        ]
      }),
      columnHelper.group({
        header: "Qualifying",
        columns: [
          { accessorKey: "qualSinglesTeam", header: "Player" },
          { accessorKey: "qualSinglesRank", header: "Rank" }
        ]
      })
    ]
  }),
  columnHelper.group({
    header: "Doubles",
    columns: [
      columnHelper.group({
        header: "Main",
        columns: [
          { accessorKey: "mainDoublesTeam", header: "Player" },
          { accessorKey: "mainDoublesRank", header: "Rank" }
        ]
      }),
      columnHelper.group({
        header: "Qualifying",
        columns: [
          { accessorKey: "qualDoublesTeam", header: "Player" },
          { accessorKey: "qualDoublesRank", header: "Rank" }
        ]
      })
    ]
  })
]

const handleEditSeed = (seed: number, type: "Singles" | "Doubles", draw: "Main" | "Qualifying") => {
  const existingSeed = seeds.value.find(s => s.seed === seed && s.type === type && s.draw === draw)
  editSeed.open({ seed: existingSeed, refresh })
}
</script>

<template>
  <dashboard-subpanel
    id="seeds"
    title="Seeds"
    :icon="ICONS.seeds"
  >
    <template #right>
      <dev-only>
        <events-seeds-update
          :refresh
          icon-only
        />
      </dev-only>
      <events-seeds-chart :seeds />
    </template>

    <u-table
      :data="consolidatedSeeds"
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
          title="No seeds found"
          :icon="ICONS.noTournament"
          description="Please be patient as we work to add more data."
        >
          <template #actions>
            <u-button
              :icon="icons.reload"
              label="Refresh"
              @click="() => reloadNuxtApp()"
            />
            <dev-only>
              <events-seeds-update :refresh />
            </dev-only>
          </template>
        </u-empty>
      </template>

      <template #mainSinglesTeam-cell="{ row }">
        <div class="flex items-center gap-2">
          <players-link
            v-if="row.original.mainSinglesTeam.players.length"
            :player="row.original.mainSinglesTeam.players[0]!"
            class="mx-auto"
            :strikethrough="row.original.mainSinglesTeam.withdrew"
          />
          <template v-else>{{ "—" }}</template>
          <dev-only>
            <events-seeds-update
              :refresh
              icon-only
            />
          </dev-only>
        </div>
      </template>

      <template #mainSinglesRank-cell="{ cell }">
        {{ isDefined(cell.getValue()) ? cell.getValue()!.toLocaleString() : cell.renderValue() }}
      </template>

      <template #qualSinglesTeam-cell="{ row }">
        <div
          @click.capture.prevent="devMode ? handleEditSeed(row.original.seed!, 'Singles', 'Qualifying') : undefined"
          :class="{ 'cursor-pointer': devMode }"
        >
          <players-link
            v-if="row.original.qualSinglesTeam.players.length"
            :player="row.original.qualSinglesTeam.players[0]!"
            class="mx-auto"
            :strikethrough="row.original.qualSinglesTeam.withdrew"
          />
          <template v-else>{{ "—" }}</template>
        </div>
      </template>

      <template #qualSinglesRank-cell="{ cell, row }">
        {{ isDefined(cell.getValue()) ? cell.getValue()!.toLocaleString() : cell.renderValue() }}
      </template>

      <template #mainDoublesTeam-cell="{ row }">
        <div
          @click.capture.prevent="devMode ? handleEditSeed(row.original.seed!, 'Doubles', 'Main') : undefined"
          :class="{ 'cursor-pointer': devMode }"
        >
          <players-link
            v-if="row.original.mainDoublesTeam.players.length"
            v-for="player in row.original.mainDoublesTeam.players"
            :key="player.id"
            :player="player"
            class="mx-auto"
            :strikethrough="row.original.mainDoublesTeam.withdrew"
          />
          <template v-else>{{ "—" }}</template>
        </div>
      </template>

      <template #mainDoublesRank-cell="{ cell, row }">
        {{ isDefined(cell.getValue()) ? cell.getValue()!.toLocaleString() : cell.renderValue() }}
      </template>

      <template #qualDoublesTeam-cell="{ row }">
        <div
          @click.capture.prevent="devMode ? handleEditSeed(row.original.seed!, 'Doubles', 'Qualifying') : undefined"
          :class="{ 'cursor-pointer': devMode }"
        >
          <players-link
            v-if="row.original.qualDoublesTeam.players.length"
            v-for="player in row.original.qualDoublesTeam.players"
            :key="player.id"
            :player="player"
            class="mx-auto"
            :strikethrough="row.original.qualDoublesTeam.withdrew"
          />
          <template v-else>{{ "—" }}</template>
        </div>
      </template>

      <template #qualDoublesRank-cell="{ cell, row }">
        {{ isDefined(cell.getValue()) ? cell.getValue()!.toLocaleString() : cell.renderValue() }}
      </template>
    </u-table>
  </dashboard-subpanel>
</template>
