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

const columnPinning = ref({
  left: ["seed"],
  right: []
})

const getSeed = (seed: number, type: "Singles" | "Doubles", draw: "Main" | "Qualifying") => {
  return seeds.value.find(s => s.seed === seed && s.type === type && s.draw === draw)
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
      <events-seeds-chart
        v-if="seeds.length"
        :seeds
      />
    </template>

    <u-table
      :data="consolidatedSeeds"
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
          title="No seeds found"
          :icon="ICONS.noTournament"
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
              <events-seeds-update :refresh />
            </dev-only>
          </template>
        </u-empty>
      </template>

      <template #mainSinglesTeam-cell="{ row }">
        <dev-only>
          <events-seeds-update
            v-if="row.original.mainSinglesTeam.players.length"
            :refresh
            :seed="getSeed(row.original.seed as number, 'Singles', 'Main')"
          >
            <players-link
              :player="row.original.mainSinglesTeam.players[0]!"
              class="mx-auto"
              :strikethrough="row.original.mainSinglesTeam.withdrew"
            />
          </events-seeds-update>
          <template v-else>—</template>
          <template #fallback>
            <players-link
              v-if="row.original.mainSinglesTeam.players.length"
              :player="row.original.mainSinglesTeam.players[0]!"
              class="mx-auto"
              :strikethrough="row.original.mainSinglesTeam.withdrew"
            />
            <template v-else>—</template>
          </template>
        </dev-only>
      </template>

      <template #mainSinglesRank-cell="{ cell, row }">
        <dev-only>
          <events-seeds-update
            v-if="isDefined(cell.getValue())"
            :refresh
            :seed="getSeed(row.original.seed as number, 'Singles', 'Main')"
          >
            {{ isDefined(cell.getValue()) ? cell.getValue()!.toLocaleString() : cell.renderValue() }}
          </events-seeds-update>
          <template v-else>
            {{ isDefined(cell.getValue()) ? cell.getValue()!.toLocaleString() : cell.renderValue() }}
          </template>
          <template #fallback>
            {{ isDefined(cell.getValue()) ? cell.getValue()!.toLocaleString() : cell.renderValue() }}
          </template>
        </dev-only>
      </template>

      <template #qualSinglesTeam-cell="{ row }">
        <dev-only>
          <events-seeds-update
            v-if="row.original.qualSinglesTeam.players.length"
            :refresh
            :seed="getSeed(row.original.seed as number, 'Singles', 'Qualifying')"
          >
            <players-link
              :player="row.original.qualSinglesTeam.players[0]!"
              class="mx-auto"
              :strikethrough="row.original.qualSinglesTeam.withdrew"
            />
          </events-seeds-update>
          <template v-else>—</template>
          <template #fallback>
            <players-link
              v-if="row.original.qualSinglesTeam.players.length"
              :player="row.original.qualSinglesTeam.players[0]!"
              class="mx-auto"
              :strikethrough="row.original.qualSinglesTeam.withdrew"
            />
            <template v-else>—</template>
          </template>
        </dev-only>
      </template>

      <template #qualSinglesRank-cell="{ cell, row }">
        <dev-only>
          <events-seeds-update
            v-if="isDefined(cell.getValue())"
            :refresh
            :seed="getSeed(row.original.seed as number, 'Singles', 'Qualifying')"
          >
            {{ isDefined(cell.getValue()) ? cell.getValue()!.toLocaleString() : cell.renderValue() }}
          </events-seeds-update>
          <template v-else>
            {{ isDefined(cell.getValue()) ? cell.getValue()!.toLocaleString() : cell.renderValue() }}
          </template>
          <template #fallback>
            {{ isDefined(cell.getValue()) ? cell.getValue()!.toLocaleString() : cell.renderValue() }}
          </template>
        </dev-only>
      </template>

      <template #mainDoublesTeam-cell="{ row }">
        <dev-only>
          <events-seeds-update
            v-if="row.original.mainDoublesTeam.players.length"
            :refresh
            :seed="getSeed(row.original.seed as number, 'Doubles', 'Main')"
          >
            <div class="flex flex-col">
              <players-link
                v-for="player in row.original.mainDoublesTeam.players"
                :key="player.id"
                :player
                :strikethrough="row.original.mainDoublesTeam.withdrew"
              />
            </div>
          </events-seeds-update>
          <template v-else>—</template>
          <template #fallback>
            <players-link
              v-if="row.original.mainDoublesTeam.players.length"
              v-for="player in row.original.mainDoublesTeam.players"
              :key="player.id"
              :player
              class="mx-auto"
              :strikethrough="row.original.mainDoublesTeam.withdrew"
            />
            <template v-else>—</template>
          </template>
        </dev-only>
      </template>

      <template #mainDoublesRank-cell="{ cell, row }">
        <dev-only>
          <events-seeds-update
            v-if="isDefined(cell.getValue())"
            :refresh
            :seed="getSeed(row.original.seed as number, 'Doubles', 'Main')"
          >
            {{ isDefined(cell.getValue()) ? cell.getValue()!.toLocaleString() : cell.renderValue() }}
          </events-seeds-update>
          <template v-else>
            {{ isDefined(cell.getValue()) ? cell.getValue()!.toLocaleString() : cell.renderValue() }}
          </template>
          <template #fallback>
            {{ isDefined(cell.getValue()) ? cell.getValue()!.toLocaleString() : cell.renderValue() }}
          </template>
        </dev-only>
      </template>

      <template #qualDoublesTeam-cell="{ row }">
        <dev-only>
          <events-seeds-update
            v-if="row.original.qualDoublesTeam.players.length"
            :refresh
            :seed="getSeed(row.original.seed as number, 'Doubles', 'Qualifying')"
          >
            <div class="flex flex-col">
              <players-link
                v-for="player in row.original.qualDoublesTeam.players"
                :key="player.id"
                :player
                :strikethrough="row.original.qualDoublesTeam.withdrew"
              />
            </div>
          </events-seeds-update>
          <template v-else>—</template>
          <template #fallback>
            <players-link
              v-if="row.original.qualDoublesTeam.players.length"
              v-for="player in row.original.qualDoublesTeam.players"
              :key="player.id"
              :player
              class="mx-auto"
              :strikethrough="row.original.qualDoublesTeam.withdrew"
            />
            <template v-else>—</template>
          </template>
        </dev-only>
      </template>

      <template #qualDoublesRank-cell="{ cell, row }">
        <dev-only>
          <events-seeds-update
            v-if="isDefined(cell.getValue())"
            :refresh
            :seed="getSeed(row.original.seed as number, 'Doubles', 'Qualifying')"
          >
            {{ isDefined(cell.getValue()) ? cell.getValue()!.toLocaleString() : cell.renderValue() }}
          </events-seeds-update>
          <template v-else>
            {{ isDefined(cell.getValue()) ? cell.getValue()!.toLocaleString() : cell.renderValue() }}
          </template>
          <template #fallback>
            {{ isDefined(cell.getValue()) ? cell.getValue()!.toLocaleString() : cell.renderValue() }}
          </template>
        </dev-only>
      </template>
    </u-table>
  </dashboard-subpanel>
</template>
