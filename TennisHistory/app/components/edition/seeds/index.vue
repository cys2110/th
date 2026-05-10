<script setup lang="ts">
import { LazyEditionSeedsCreate, UButton } from "#components"
import type { TableColumn } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues } from "@tanstack/vue-table"

const {
  params: { edId, year }
} = useRoute("edition")

const toast = useToast()

const {
  ui: { icons }
} = useAppConfig()
const { dev } = useRuntimeConfig().public

const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()

const updatedSeeds = ref<Record<string, number | null>>({})
const isSaving = ref(false)

const key = computed(() => `${edId}-seeds`)

const {
  data: seeds,
  pending,
  refresh
} = await useAsyncData<Array<SeedInterface>>(
  key,
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
  ...(dev ? [{ id: "checkbox", footer: () => h(LazyEditionSeedsCreate, { hydrateOnIdle: true, onRefresh: refresh }) }] : []),
  { accessorKey: "tour" },
  { accessorKey: "match_type" },
  { accessorKey: "draw" },
  { accessorKey: "seed", header: "Seed" },
  {
    id: "team",
    accessorFn: row => row.team.map(player => `${player.last_name}, ${player.first_name}`),
    ...(dev && { footer: () => h("div", { class: "flex justify-end" }, h(UButton, { icon: icons.reload, onClick: () => refresh() })) })
  },
  {
    accessorKey: "rank",
    header: "Rank",
    ...(dev && {
      footer: () =>
        h(UButton, {
          icon: isSaving.value ? ICONS.uploading : ICONS.save,
          disabled: isSaving.value || !Object.keys(updatedSeeds.value).length,
          onClick: handleSave
        })
    })
  }
]

const columnVisibility = computed(() => ({
  tour: tournamentStore.tours.length > 1
}))

const handleSave = async () => {
  set(isSaving, true)
  const errors: Record<string, any> = {}

  for (const [seedId, rank] of Object.entries(updatedSeeds.value)) {
    const { error } = await supabase.from("seeds").update({ rank }).eq("id", seedId)

    if (error) errors[seedId] = error
  }

  if (Object.keys(errors).length) {
    console.log(errors)

    toast.add({
      title: "Error updating seeds",
      description: `${Object.keys(updatedSeeds).length - errors.length} successfully updated. ${errors.length} failed.`,
      icon: icons.error,
      color: "error"
    })
  } else {
    toast.add({
      title: "Seeds successfully updated",
      icon: icons.success,
      color: "success"
    })
  }

  refresh()
  set(updatedSeeds, {})
  set(isSaving, false)
}
</script>

<template>
  <div class="flex justify-end mb-4">
    <edition-seeds-chart
      :seeds
      :pending
    />
  </div>

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
    v-model:column-visibility="columnVisibility"
    :meta="{
      class: {
        tr: row => (row.original.draw === 'Qualifying' ? 'bg-elevated dark:bg-muted/50' : '')
      }
    }"
    :ui="{ root: 'xl:max-w-3/4 2xl:max-w-2/3 mx-auto max-h-[calc(100vh-25rem)]', td: 'empty:p-0' }"
  >
    <template #loading>
      <u-icon
        :name="icons.loading"
        class="size-8"
      />
    </template>

    <template #empty>
      <u-empty
        :icon="ICONS.trophyOff"
        :title="`There were no seeds in ${tournamentStore.name} ${year}`"
        description="If you think this is an error, refresh the page. Otherwise, please be patient as we continue to add more data."
        class="mx-2"
      >
        <template #actions>
          <u-button
            label="Refresh"
            :icon="icons.reload"
            @click="refresh()"
          />
        </template>
      </u-empty>
    </template>

    <template #checkbox-header>
      <div class="w-fit mx-auto">
        <u-checkbox
          :model-value="
            Object.keys(updatedSeeds).length === seeds.length ? true
            : Object.keys(updatedSeeds).length ? 'indeterminate'
            : false
          "
          @update:model-value="
            () => {
              if (Object.keys(updatedSeeds).length === seeds.length) {
                updatedSeeds = {}
              } else {
                seeds.forEach(seed => (updatedSeeds[seed.id] = seed.rank))
              }
            }
          "
          :icon="ICONS.ranking"
        />
      </div>
    </template>

    <template #checkbox-cell="{ row }">
      <div class="w-fit mx-auto">
        <u-checkbox
          :model-value="row.original.id in updatedSeeds"
          @update:model-value="
            () => {
              if (row.original.id in updatedSeeds) {
                delete updatedSeeds[row.original.id]
              } else {
                updatedSeeds[row.original.id] = row.original.rank
              }
            }
          "
          :icon="ICONS.ranking"
        />
      </div>
    </template>

    <template #tour-header="{ column }">
      <table-filter-header
        :column
        label="Tour"
        :icon="ICONS.tour"
      />
    </template>

    <template #tour-cell="{ row }">
      <u-badge
        :label="row.original.tour"
        :color="row.original.tour"
      />
    </template>

    <template #match_type-header="{ column }">
      <table-filter-header
        :column
        label="S/D"
        :icon="ICONS.people"
      />
    </template>

    <template #match_type-cell="{ row }">
      <u-badge
        :label="row.original.match_type"
        :color="row.original.match_type"
      />
    </template>

    <template #draw-header="{ column }">
      <table-filter-header
        :column
        label="Draw"
        :icon="ICONS.level"
      />
    </template>

    <template #draw-cell="{ row }">
      <u-badge
        :label="row.original.draw"
        :color="row.original.draw"
      />
    </template>

    <template #team-header="{ column }">
      <div class="flex justify-center items-center gap-0.5">
        <table-name-filter-header
          :column
          label="Team"
          :icon="ICONS.player"
          type="name"
          multiple
        />
        <table-sort-header :column />
      </div>
    </template>

    <template #team-cell="{ row }">
      <players-link
        :players="row.original.team"
        :strikethrough="row.original.withdrew"
      />
    </template>

    <template #rank-cell="{ row }">
      <form-input-number
        v-if="row.original.id in updatedSeeds"
        v-model="updatedSeeds[row.original.id]"
        placeholder="Rank"
        class="max-w-25"
      />

      <div
        v-else
        :class="{ 'line-through': row.original.withdrew }"
      >
        {{ isDefined(row.original.rank) ? row.original.rank.toLocaleString() : "—" }}
      </div>
    </template>
  </u-table>
</template>
