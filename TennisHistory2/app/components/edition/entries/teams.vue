<script setup lang="ts">
import type { TableColumn, TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues } from "@tanstack/vue-table"

const {
  params: { edId }
} = useRoute("edition")

const {
  ui: { colors }
} = useAppConfig()

const toast = useToast()

const supabase = useSupabaseClient()

const { data: entries, pending } = await useAsyncData<Array<TeamEntryInterface>>("team-entries", async () => {
  const { data, error } = await supabase
    .from("entries")
    .select(
      "id, match_type, player_entry_mapping(players(id, first_name, last_name), countries(*), rank), events!inner(edition_id, tour), entry_status(status, draw), seeds(seed, draw), t1:matches!team_1_id(draw), t2:matches!team_2_id(draw)"
    )
    .eq("events.edition_id", Number(edId))

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
          country: pem.countries,
          rank: pem.rank
        })),
        seed: entry.seeds.map(s => (s.draw === "Qualifying" ? `Q-${s.seed}` : s.seed)),
        statuses: entry.entry_status.map(es => (es.draw === "Qualifying" ? `Q-${es.status}` : es.status)),
        draws: useArrayUnique([...(entry.t1.map(m => m.draw) || []), ...(entry.t2.map(m => m.draw) || [])]).value.filter(Boolean)
      }) as TeamEntryInterface
  )
})

const columns: TableColumn<TeamEntryInterface>[] = [
  { accessorKey: "tour" },
  {
    accessorKey: "match_type"
  },
  { id: "team", accessorFn: row => row.team.map(player => `${player.last_name}, ${player.first_name}`).join(" / ") },
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
    id: "seed",
    accessorFn: row => row.seed?.[0],
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

      if (!filterValue) return true
      if (!filterValue.length) return true
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

const handleSelectRow = (_e: Event, row: TableRow<TeamEntryInterface>) => {
  toast.clear()

  toast.add({
    title: "Go to...",
    duration: Infinity,
    progress: false,
    actions: row.original.team.map(p => ({
      label: `${p.first_name} ${p.last_name}`,
      icon: ICONS.player,
      to: {
        name: "player",
        params: {
          id: p.id,
          name: p.first_name ? kebabCase(`${p.first_name} ${p.last_name}`) : "—"
        }
      }
    }))
  })
}

onUnmounted(() => {
  toast.clear()
})
onBeforeRouteLeave(() => {
  toast.clear()
})
</script>

<template>
  <u-table
    :data="entries"
    :columns
    :loading="pending"
    @select="handleSelectRow"
    :faceted-options="{
      getFacetedUniqueValues: getFacetedUniqueValues(),
      getFacetedRowModel: getFacetedRowModel()
    }"
    sticky
    render-fallback-value="—"
  >
    <template #loading>
      <loading-icon />
    </template>

    <template #empty>
      <empty
        message="No entries found"
        :icon="ICONS.peopleOff"
      />
    </template>

    <template #tour-header="{ column }">
      <table-client-filter-header
        :column
        label="Tour"
      />
    </template>

    <template #tour-cell="{ row }">
      <u-badge
        :label="<string>row.original.tour"
        :color="<keyof typeof colors>row.original.tour"
      />
    </template>

    <template #match_type-header="{ column }">
      <table-client-filter-header
        :column
        label="S/D"
      />
    </template>

    <template #match_type-cell="{ row }">
      <u-badge
        :label="<string>row.original.match_type"
        :color="<keyof typeof colors>row.original.match_type"
      />
    </template>

    <template #team-header="{ column }">
      <div class="flex justify-center items-center gap-0.5">
        <table-client-name-filter-header
          :column
          label="Team"
        />
        <table-client-sort-header :column />
      </div>
    </template>

    <template #team-cell="{ row }">
      <player-link
        v-for="player in row.original.team"
        :key="player.id"
        :player
      />
    </template>

    <template #draws-header="{ column }">
      <table-client-filter-header
        :column
        label="Draws"
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
      <table-client-sort-header
        :column
        label="Seed"
      />
    </template>

    <template #statuses-header="{ column }">
      <table-client-filter-header
        :column
        label="Statuses"
      />
    </template>

    <template #rank-header="{ column }">
      <table-client-sort-header
        :column
        label="Rank"
      />
    </template>

    <template #rank-cell="{ row }">
      <div>
        <div v-for="player in row.original.team">{{ player.rank }}</div>
      </div>
    </template>
  </u-table>
</template>
