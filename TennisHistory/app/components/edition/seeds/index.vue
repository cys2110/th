<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues, getGroupedRowModel } from "@tanstack/vue-table"

const {
  params: { edId, year }
} = useRoute("edition")

const toast = useToast()

const {
  ui: { icons, colors }
} = useAppConfig()

const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()

const updatedSeeds = ref<Record<string, number | null>>({})
const isSaving = ref(false)

const {
  data: seeds,
  pending,
  refresh
} = await useAsyncData<SeedInterface[]>(
  "seeds",
  async () => {
    const { data, error } = await supabase
      .from("seeds")
      .select(
        "*, events!inner(edition_id), entries(withdrawals(id, draw), player_entry_mapping(countries(*), players(id, first_name, last_name, tour)))"
      )
      .eq("events.edition_id", Number(edId))
      .order("event_id", { ascending: true })
      .order("draw", { ascending: true })
      .order("match_type", { ascending: true })
      .order("seed", { ascending: true })

    if (error || !data) {
      console.error("Error fetching seeds:", error)
      return []
    }

    return data.map(
      seed =>
        ({
          id: seed.id,
          seed: seed.seed,
          draw: seed.draw,
          match_type: seed.match_type,
          rank: seed.rank,
          tour: seed.entries.player_entry_mapping[0]?.players.tour,
          withdrew: !!seed.entries.withdrawals.find(w => w.draw === seed.draw),
          team: seed.entries.player_entry_mapping.map(entry => ({
            id: entry.players.id,
            first_name: entry.players.first_name,
            last_name: entry.players.last_name,
            country: entry.countries
          }))
        }) as SeedInterface
    )
  },
  { default: () => [] }
)

const columns: Array<TableColumn<SeedInterface>> = [
  { accessorKey: "tour" },
  { accessorKey: "match_type" },
  { accessorKey: "draw" },
  { accessorKey: "seed", header: "Seed" },
  { id: "team", accessorFn: row => row.team.map(player => `${player.last_name}, ${player.first_name}`).join(" / ") },
  { accessorKey: "rank", header: "Rank" }
]

const handleSave = async () => {
  set(isSaving, true)
  const data = Object.entries(updatedSeeds.value)

  for (const [seedId, rank] of data) {
    const { error } = await supabase.from("seeds").update({ rank }).eq("id", seedId)

    if (error) {
      console.error(`Error updating seed ${seedId}:`, error)
    }
  }

  refresh()
  toast.add({
    title: "Seeds updated successfully",
    icon: icons.success,
    color: "success"
  })
  set(isSaving, false)
}
</script>

<template>
  <dashboard-subpanel
    title="Seeds"
    :icon="ICONS.ranking"
  >
    <template #right>
      <dev-only>
        <edition-seeds-create @refresh="refresh" />

        <u-button
          color="warning"
          :icon="ICONS.save"
          @click="handleSave"
        />
      </dev-only>

      <edition-seeds-chart
        :seeds
        :pending
      />
    </template>

    <u-table
      :data="seeds"
      :columns
      :loading="pending"
      sticky
      render-fallback-value="—"
      :faceted-options="{
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues()
      }"
      :grouping-options="{
        getGroupedRowModel: getGroupedRowModel()
      }"
      :meta="{
        class: {
          tr: row => (row.original.draw === 'Qualifying' ? 'bg-muted/50' : '')
        }
      }"
      :ui="{ td: 'empty:p-0' }"
    >
      <template #loading>
        <loading-icon />
      </template>

      <template #empty>
        <empty
          :message="`No seeds found for ${tournamentStore.name} ${year}`"
          :icon="ICONS.trophyOff"
        />
      </template>

      <template #tour-header="{ column }">
        <div class="flex justify-center items-center gap-0.5">
          <table-client-group-header :column />
          <table-client-filter-header
            :column
            label="Tour"
            :icon="ICONS.tour"
          />
          <table-client-sort-header :column />
        </div>
      </template>

      <template #tour-cell="{ row, table }">
        <table-row-toggle
          v-if="row.getIsGrouped() && row.groupingColumnId === 'tour'"
          :row
        >
          <u-badge
            :label="<string>row.original.tour"
            :color="<keyof typeof colors>row.original.tour"
          />
        </table-row-toggle>

        <u-badge
          v-else-if="!row.getIsGrouped() && !table.getState().grouping.includes('tour')"
          :label="<string>row.original.tour"
          :color="<keyof typeof colors>row.original.tour"
        />

        <template v-else>{{ " " }}</template>
      </template>

      <template #match_type-header="{ column }">
        <div class="flex justify-center items-center gap-0.5">
          <table-client-group-header :column />
          <table-client-filter-header
            :column
            label="S/D"
            :icon="ICONS.people"
          />
          <table-client-sort-header :column />
        </div>
      </template>

      <template #match_type-cell="{ row, table }">
        <table-row-toggle
          v-if="row.getIsGrouped() && row.groupingColumnId === 'match_type'"
          :row
        >
          <u-badge
            :label="<string>row.original.match_type"
            :color="<keyof typeof colors>row.original.match_type"
          />
        </table-row-toggle>

        <u-badge
          v-else-if="!row.getIsGrouped() && !table.getState().grouping.includes('match_type')"
          :label="<string>row.original.match_type"
          :color="<keyof typeof colors>row.original.match_type"
        />

        <template v-else>{{ " " }}</template>
      </template>

      <template #draw-header="{ column }">
        <div class="flex justify-center items-center gap-0.5">
          <table-client-group-header :column />
          <table-client-filter-header
            :column
            label="Draw"
            :icon="ICONS.level"
          />
          <table-client-sort-header :column />
        </div>
      </template>

      <template #draw-cell="{ row, table }">
        <table-row-toggle
          v-if="row.getIsGrouped() && row.groupingColumnId === 'draw'"
          :row
        >
          <u-badge
            :label="<string>row.original.draw"
            :color="<keyof typeof colors>row.original.draw"
          />
        </table-row-toggle>

        <u-badge
          v-else-if="!row.getIsGrouped() && !table.getState().grouping.includes('draw')"
          :label="<string>row.original.draw"
          :color="<keyof typeof colors>row.original.draw"
        />

        <template v-else>{{ " " }}</template>
      </template>

      <template #team-header="{ column }">
        <div class="flex justify-center items-center gap-0.5">
          <table-client-name-filter-header
            :column
            label="Team"
            :icon="ICONS.player"
          />
          <table-client-sort-header :column />
        </div>
      </template>

      <template #team-cell="{ row }">
        <player-link
          v-if="!row.getIsGrouped()"
          v-for="player in row.original.team"
          :key="player.id"
          :player
          :strikethrough="row.original.withdrew"
        />

        <template v-else>{{ " " }}</template>
      </template>

      <template #rank-cell="{ row, cell }">
        <dev-only v-if="!row.getIsGrouped()">
          <u-input-number
            :default-value="row.original.rank || undefined"
            :model-value="updatedSeeds[row.original.id]"
            @update:model-value="updatedSeeds[row.original.id] = $event"
            placeholder="Enter rank"
            :decrement="false"
          >
            <template #increment>
              <u-button
                v-if="isDefined(updatedSeeds[row.original.id])"
                color="neutral"
                variant="link"
                :icon="icons.close"
                aria-label="Clear input"
                @click="updatedSeeds[row.original.id] = null"
              />
              <template v-else>{{ " " }}</template>
            </template>
          </u-input-number>

          <template #fallback>
            <div :class="{ 'strike-through': row.original.withdrew }">{{ cell.renderValue() }}</div>
          </template>
        </dev-only>

        <template v-else>{{ " " }}</template>
      </template>
    </u-table>
  </dashboard-subpanel>
</template>
