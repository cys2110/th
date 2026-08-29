<script setup lang="ts">
import type { TableColumn, TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues } from "@tanstack/vue-table"

const {
  params: { edId, year }
} = useRoute("edition")

const {
  ui: { icons }
} = useAppConfig()

const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()

const key = computed(() => `${edId}-team-entries`)

const {
  data: entries,
  pending,
  refresh
} = await useAsyncData<Array<TeamEntryInterface>>(key, async () => {
  const { data, error } = await supabase
    .from("entries")
    .select(
      `
      *,
      player_entry_mapping(
        countries(*),
        players(id, full_name, first_name, last_name),
        rank
      ),
      events!inner(edition_id, tour),
      entry_status(status, draw),
      seeds(seed, draw),
      t1:matches!team_1_id(draw),
      t2:matches!team_2_id(draw)
    `
    )
    .eq("events.edition_id", Number(edId))
    .order("id", { ascending: true })

  if (error || !data) {
    console.error("Error fetching team entries:", error)
    return []
  }

  return data.map(
    entry =>
      ({
        id: entry.id,
        tour: entry.events.tour,
        match_type: entry.match_type,
        team: entry.player_entry_mapping.map(pem => ({
          id: pem.players.id,
          first_name: pem.players.first_name,
          last_name: pem.players.last_name,
          full_name: pem.players.full_name,
          country: pem.countries,
          rank: pem.rank
        })),
        seed: entry.seeds.map(s => (s.draw === "Qualifying" ? `Q-${s.seed}` : s.seed))[0],
        statuses: entry.entry_status.map(es => (es.draw === "Qualifying" ? `Q-${es.status}` : es.status)),
        draws: useArrayUnique([...(entry.t1.map(m => m.draw) || []), ...(entry.t2.map(m => m.draw) || [])]).value.filter(Boolean)
      }) as TeamEntryInterface
  )
})

const columns: TableColumn<TeamEntryInterface>[] = [
  { accessorKey: "tour" },
  { accessorKey: "match_type" },
  { id: "team", accessorFn: row => row.team.map(player => `${player.last_name}, ${player.first_name}`), filterFn: arrayFilter },
  {
    accessorKey: "draws",
    filterFn: (row, columnId, filterValue) => {
      const values = (row.getValue(columnId) as string[]) || []

      if (!filterValue?.length) return true
      if (values.some(v => filterValue.includes(v))) return true
      return false
    }
  },
  {
    accessorKey: "seed",
    sortingFn: (rowA, rowB, columnId) => {
      const valueA = rowA.getValue(columnId)
      const valueB = rowB.getValue(columnId)
      const groupA =
        typeof valueA === "number" ? 0
        : typeof valueA === "string" ? 1
        : 2
      const groupB =
        typeof valueB === "number" ? 0
        : typeof valueB === "string" ? 1
        : 2

      if (groupA !== groupB) return groupA - groupB

      if (typeof valueA === "number" && typeof valueB === "number") return valueA - valueB
      if (typeof valueA === "string" && typeof valueB === "string") return valueA.localeCompare(valueB, undefined, { numeric: true })

      return 0
    }
  },
  {
    accessorKey: "statuses",
    filterFn: (row, columnId, filterValue) => {
      const values = (row.getValue(columnId) as string[]) || []

      if (!filterValue?.length) return true
      if (values.some(v => filterValue.includes(v))) return true
      return false
    }
  },
  {
    id: "rank",
    accessorFn: row => row.team.reduce((acc, player) => acc + (player.rank ?? 0), 0),
    sortingFn: (rowA, rowB, columnId) => {
      const valueA = rowA.getValue(columnId)
      const valueB = rowB.getValue(columnId)

      if (valueA === undefined || valueA === 0) return 1
      if (valueB === undefined || valueB === 0) return -1

      return (valueA as number) - (valueB as number)
    }
  }
]
</script>

<template>
  <u-table
    :data="entries"
    :columns
    :loading="pending"
    :faceted-options="{
      getFacetedUniqueValues: getFacetedUniqueValues(),
      getFacetedRowModel: getFacetedRowModel()
    }"
    sticky
    render-fallback-value="—"
    :ui="{ tbody: '[&>tr]:even:bg-elevated/25' }"
  >
    <template #loading>
      <u-icon
        :name="icons.loading"
        class="size-8"
      />
    </template>

    <template #empty>
      <u-empty
        :icon="ICONS.peopleOff"
        :title="`There were no entries in ${tournamentStore.name} ${year}`"
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

    <template #team-header="{ column }">
      <div class="flex justify-center items-center gap-0.5">
        <table-filter-header
          :column
          label="Team"
          type="name"
          :icon="ICONS.player"
          multiple
        />
        <table-sort-header :column />
      </div>
    </template>

    <template #team-cell="{ row }">
      <player-link :players="row.original.team" />
    </template>

    <template #draws-header="{ column }">
      <table-filter-header
        :column
        label="Draws"
        :icon="ICONS.level"
      />
    </template>

    <template #draws-cell="{ row }">
      <div class="space-x-1">
        <template
          v-for="draw in row.original.draws"
          :key="draw"
        >
          <u-badge
            v-if="draw"
            :label="draw"
            :color="draw"
          />
        </template>
      </div>
    </template>

    <template #seed-header="{ column }">
      <table-sort-header
        :column
        label="Seed"
      />
    </template>

    <template #statuses-header="{ column }">
      <table-filter-header
        :column
        label="Statuses"
      />
    </template>

    <template #rank-header="{ column }">
      <table-sort-header
        :column
        label="Rank"
      />
    </template>

    <template #rank-cell="{ row, cell }">
      <div class="flex justify-center items-center gap-2">
        <div>
          <div v-for="player in row.original.team">{{ player.rank }}</div>
        </div>

        <div v-if="row.original.match_type === 'Doubles'"> [{{ cell.getValue() }}] </div>
      </div>
    </template>
  </u-table>
</template>
