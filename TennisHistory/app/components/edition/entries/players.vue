<script setup lang="ts">
import { LazyEditionEntriesCreate, LazyEditionEntriesCreateLc, LazyScrapeActivity, UBadge, UButton, UFieldGroup } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import { createColumnHelper, getFacetedRowModel, getFacetedUniqueValues } from "@tanstack/vue-table"

const {
  params: { id, edId, year }
} = useRoute("edition")

const {
  ui: { icons }
} = useAppConfig()

const { dev } = useRuntimeConfig().public
const router = useRouter()
const toast = useToast()
const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()

const isSaving = ref(false)
const updatedMapping = ref<Record<string, any>>({})
const updatedEntries = ref<Record<string, any>>({})

const key = computed(() => `${edId}-players`)

const {
  data: entries,
  pending,
  refresh
} = await useAsyncData<Array<IndividualPlayerEntryInterface>>(
  key,
  async () => {
    const { data: events, error: eventsError } = await supabase.from("events").select("id").eq("edition_id", Number(edId))

    if (eventsError || !events) {
      console.error("Error fetching events:", eventsError)
      return []
    }

    const { data, error } = await supabase
      .from("player_entry_mapping")
      .select(
        `
      id,
      countries(*),
      players(id, first_name, last_name, tour),
      rank,
      entries!inner(
        id,
        points,
        pm,
        match_type,
        entry_status(status, draw),
        seeds(seed, draw),
        t1:matches!team_1_id(draw),
        t2:matches!team_2_id(draw),
        events(currency)
      )
    `
      )
      .in(
        "entries.event_id",
        events.map(event => event.id)
      )
      .order("players(last_name)", { ascending: true })
      .order("players(first_name)", { ascending: true })

    if (error || !data) {
      console.error("Error fetching players:", error)
      return []
    }

    const groupedPems = groupBy(data, pem => pem.players.id)
    const players: IndividualPlayerEntryInterface[] = []

    for (const pem of Object.values(groupedPems)) {
      const singlesEntry = pem.find(e => e.entries.match_type === "Singles")
      const doublesEntry = pem.find(e => e.entries.match_type === "Doubles")

      players.push({
        id: pem[0]?.players.id!,
        first_name: pem[0]?.players.first_name!,
        last_name: pem[0]?.players.last_name!,
        country: pem[0]?.countries!,
        tour: pem[0]?.players.tour!,
        currency: pem[0]?.entries.events.currency!,
        singles: {
          id: singlesEntry?.id,
          entry_id: singlesEntry?.entries.id,
          points: singlesEntry?.entries.points,
          pm: singlesEntry?.entries.pm,
          rank: singlesEntry?.rank,
          seed: singlesEntry?.entries.seeds.map(s => (s.draw === "Qualifying" ? `Q-${s.seed}` : s.seed)),
          statuses: singlesEntry?.entries.entry_status.map(es => (es.draw === "Qualifying" ? `Q-${es.status}` : es.status)),
          draws: useArrayUnique([
            ...(singlesEntry?.entries.t1.map(m => m.draw) || []),
            ...(singlesEntry?.entries.t2.map(m => m.draw) || [])
          ]).value.filter(Boolean)
        },
        doubles: {
          id: doublesEntry?.id,
          entry_id: doublesEntry?.entries.id,
          points: doublesEntry?.entries.points,
          pm: doublesEntry?.entries.pm,
          rank: doublesEntry?.rank,
          seed: doublesEntry?.entries.seeds.map(s => (s.draw === "Qualifying" ? `Q-${s.seed}` : s.seed)),
          statuses: doublesEntry?.entries.entry_status.map(es => (es.draw === "Qualifying" ? `Q-${es.status}` : es.status)),
          draws: useArrayUnique([
            ...(doublesEntry?.entries.t1.map(m => m.draw) || []),
            ...(doublesEntry?.entries.t2.map(m => m.draw) || [])
          ]).value.filter(Boolean)
        }
      } as IndividualPlayerEntryInterface)
    }
    return players
  },
  { default: () => [] }
)

const columnVisibility = ref({
  tour: tournamentStore.tours.length > 1,
  singles_checkbox: dev,
  singles_draws: COUNTRY_DRAWS.includes(id) ? false : true,
  singles_seed: COUNTRY_DRAWS.includes(id) ? false : true,
  singles_statuses: COUNTRY_DRAWS.includes(id) ? false : true,
  doubles_checkbox: dev,
  doubles_draws: COUNTRY_DRAWS.includes(id) ? false : true,
  doubles_seed: COUNTRY_DRAWS.includes(id) ? false : true,
  doubles_statuses: COUNTRY_DRAWS.includes(id) ? false : true
})

const columnHelper = createColumnHelper<IndividualPlayerEntryInterface>()
const columns: TableColumn<IndividualPlayerEntryInterface>[] = [
  { accessorKey: "tour" },
  {
    id: "player",
    accessorFn: row => `${row.last_name}, ${row.first_name}`,
    filterFn: "arrIncludesSome",
    ...(dev && {
      footer: () =>
        h(UFieldGroup, { class: "w-fit mx-auto" }, () => [
          h(id === "9210" ? LazyEditionEntriesCreateLc : LazyEditionEntriesCreate, { hydrateOnIdle: true, onRefresh: refresh }),
          h(UButton, { icon: icons.reload, onClick: () => refresh() }),
          h(UButton, {
            icon: ICONS.columnVisibility,
            onClick: () => {
              set(columnVisibility, {
                ...columnVisibility.value,
                singles_seed: !columnVisibility.value.singles_seed,
                singles_statuses: !columnVisibility.value.singles_statuses,
                doubles_seed: !columnVisibility.value.doubles_seed,
                doubles_statuses: !columnVisibility.value.doubles_statuses
              })
            }
          }),
          h(UButton, {
            icon: isSaving.value ? ICONS.uploading : ICONS.save,
            disabled: isSaving.value || (!Object.keys(updatedMapping.value).length && !Object.keys(updatedEntries.value).length),
            onClick: handleSave
          })
        ])
    })
  },
  columnHelper.group({
    id: "singles",
    header: () => h(UBadge, { label: "Singles", color: "Singles", class: "w-full" }),
    columns: [
      {
        id: "singles_checkbox",
        footer: () =>
          h(LazyScrapeActivity, {
            matchType: "Singles",
            players: entries.value
              .filter(player => player.singles.id && !isDefined(player.singles.rank))
              .map(player => ({ id: player.id, entry_id: player.singles.entry_id! })),
            onRefresh: refresh,
            disabled: entries.value.filter(player => player.singles.id).every(player => isDefined(player.singles.rank))
          })
      },
      {
        accessorKey: "singles.draws",
        filterFn: (row, columnId, filterValue) => {
          const values = (row.getValue(columnId) as string[]) || []

          if (!filterValue?.length) return true
          if (values.some(v => filterValue.includes(v))) return true
          return false
        }
      },
      {
        id: "singles_seed",
        accessorFn: row => row.singles.seed?.[0],
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
      { accessorKey: "singles.statuses", filterFn: arrayFilter },
      { accessorKey: "singles.rank" },
      { accessorKey: "singles.points", header: "Points" },
      { accessorKey: "singles.pm", header: "PM" }
    ]
  }),
  columnHelper.group({
    id: "doubles",
    header: () => h(UBadge, { label: "Doubles", color: "Doubles", class: "w-full" }),
    columns: [
      {
        id: "doubles_checkbox",
        footer: () =>
          h(LazyScrapeActivity, {
            matchType: "Doubles",
            players: entries.value
              .filter(player => player.doubles.id && !isDefined(player.doubles.rank))
              .map(player => ({ id: player.id, entry_id: player.doubles.entry_id! })),
            onRefresh: refresh,
            disabled: entries.value.filter(player => player.doubles.id).every(player => isDefined(player.doubles.rank))
          })
      },
      {
        accessorKey: "doubles.draws",
        filterFn: (row, columnId, filterValue) => {
          const values = (row.getValue(columnId) as string[]) || []

          if (!filterValue?.length) return true
          if (values.some(v => filterValue.includes(v))) return true
          return false
        }
      },
      {
        id: "doubles_seed",
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
      { accessorKey: "doubles.statuses", filterFn: arrayFilter },
      { accessorKey: "doubles.rank" },
      { accessorKey: "doubles.points", header: "Points" },
      { accessorKey: "doubles.pm", header: "PM" }
    ]
  })
]

const handleSelectRow = (_e: Event, row: TableRow<IndividualPlayerEntryInterface>) => {
  if (!dev) {
    router.push({
      name: "player",
      params: {
        id: row.original.id,
        name: row.original.first_name ? kebabCase(`${row.original.first_name} ${row.original.last_name}`) : "—"
      }
    })
  }
}

const handleSave = async () => {
  set(isSaving, true)

  if (Object.keys(updatedMapping.value).length) {
    for (const [id, rank] of Object.entries(updatedMapping.value)) {
      const { error } = await supabase.from("player_entry_mapping").update({ rank }).eq("id", id)

      if (error) console.error(`Error updating rank for ${id}`, error)
    }

    set(updatedMapping, {})
  }

  if (Object.keys(updatedEntries.value).length) {
    for (const [id, entry] of Object.entries(updatedEntries.value)) {
      const { error } = await supabase
        .from("entries")
        .update({ ...entry })
        .eq("id", id)

      if (error) console.error(`Error updating entry ${id}`, error)
    }

    set(updatedEntries, {})
  }

  set(isSaving, false)
  refresh()
}
</script>

<template>
  <u-table
    :data="entries"
    :columns
    :loading="pending"
    sticky
    render-fallback-value="—"
    @select="handleSelectRow"
    v-model:column-visibility="columnVisibility"
    :faceted-options="{
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues()
    }"
    :ui="{ root: 'max-w-fit mx-auto max-h-[calc(100vh-25rem)]' }"
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
        :title="`No players played in ${tournamentStore.name} ${year}`"
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

    <template #player-header="{ column }">
      <div class="flex justify-center items-center gap-0.5">
        <table-filter-header
          :column
          label="Player"
          type="name"
          multiple
          :icon="ICONS.player"
        />
        <table-sort-header :column />
      </div>
    </template>

    <template #player-cell="{ row }">
      <players-link :players="[row.original]" />
    </template>

    <template #singles_checkbox-cell="{ row }">
      <div class="w-fit mx-auto flex items-center gap-1">
        <div>
          <u-checkbox
            v-if="row.original.singles.id"
            label="Rank"
            :model-value="row.original.singles.id in updatedMapping"
            @update:model-value="
              () => {
                if (row.original.singles.id! in updatedMapping) {
                  delete updatedMapping[row.original.singles.id!]
                } else {
                  updatedMapping[row.original.singles.id!] = row.original.singles.rank
                }
              }
            "
          />
          <u-checkbox
            v-if="row.original.singles.entry_id"
            label="Entry"
            :model-value="row.original.singles.entry_id in updatedEntries"
            @update:model-value="
              () => {
                if (row.original.singles.entry_id! in updatedEntries) {
                  delete updatedEntries[row.original.singles.entry_id!]
                } else {
                  updatedEntries[row.original.singles.entry_id!] = {
                    pm: row.original.singles.pm,
                    points: row.original.singles.points
                  }
                }
              }
            "
          />
        </div>

        <lazy-scrape-activity
          v-if="row.original.tour === 'ATP' && !isDefined(row.original.singles.rank) && row.original.singles.draws.length"
          hydrate-on-idle
          match-type="Singles"
          :players="[{ id: row.original.id, entry_id: row.original.singles.entry_id! }]"
          @refresh="refresh"
        />
      </div>
    </template>

    <template #singles_draws-header="{ column }">
      <table-filter-header
        :column
        label="Draws"
        :icon="ICONS.level"
      />
    </template>

    <template #singles_draws-cell="{ row }">
      <div class="space-x-1">
        <template
          v-for="draw in row.original.singles.draws"
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

    <template #singles_seed-header="{ column }">
      <table-sort-header
        :column
        label="Seed"
      />
    </template>

    <template #singles_statuses-header="{ column }">
      <table-filter-header
        :column
        label="Statuses"
        multiple
      />
    </template>

    <template #singles_rank-header="{ column }">
      <table-sort-header
        :column
        label="Rank"
      />
    </template>

    <template #singles_rank-cell="{ row }">
      <form-input-number
        v-if="row.original.singles.id && row.original.singles.id in updatedMapping"
        v-model="updatedMapping[row.original.singles.id]"
        placeholder="Rank"
      />

      <template v-else>{{ row.original.singles.rank?.toLocaleString() }}</template>
    </template>

    <template #singles_points-cell="{ row }">
      <form-input-number
        v-if="row.original.singles.entry_id && row.original.singles.entry_id in updatedEntries"
        v-model="updatedEntries[row.original.singles.entry_id].points"
        placeholder="Points"
      />

      <template v-else>{{ row.original.singles.points?.toLocaleString() }}</template>
    </template>

    <template #singles_pm-cell="{ row }">
      <form-input-number
        v-if="row.original.singles.entry_id && row.original.singles.entry_id in updatedEntries"
        v-model="updatedEntries[row.original.singles.entry_id].pm"
        placeholder="PM"
        :currency="row.original.currency"
      />

      <template v-else>{{
        row.original.singles.pm?.toLocaleString("en-GB", { style: "currency", currency: row.original.currency || "USD" })
      }}</template>
    </template>

    <template #doubles_checkbox-cell="{ row }">
      <div class="w-fit mx-auto flex items-center gap-1">
        <div>
          <u-checkbox
            v-if="row.original.doubles.id"
            label="Rank"
            :model-value="row.original.doubles.id in updatedMapping"
            @update:model-value="
              () => {
                if (row.original.doubles.id! in updatedMapping) {
                  delete updatedMapping[row.original.doubles.id!]
                } else {
                  updatedMapping[row.original.doubles.id!] = row.original.doubles.rank
                }
              }
            "
          />
          <u-checkbox
            v-if="row.original.doubles.entry_id"
            label="Entry"
            :model-value="row.original.doubles.entry_id in updatedEntries"
            @update:model-value="
              () => {
                if (row.original.doubles.entry_id! in updatedEntries) {
                  delete updatedEntries[row.original.doubles.entry_id!]
                } else {
                  updatedEntries[row.original.doubles.entry_id!] = {
                    pm: row.original.doubles.pm,
                    points: row.original.doubles.points
                  }
                }
              }
            "
          />
        </div>

        <lazy-scrape-activity
          v-if="row.original.tour === 'ATP' && !isDefined(row.original.doubles.rank) && row.original.doubles.draws.length"
          hydrate-on-idle
          match-type="Doubles"
          :players="[{ id: row.original.id, entry_id: row.original.doubles.entry_id! }]"
          @refresh="refresh"
        />
      </div>
    </template>

    <template #doubles_draws-header="{ column }">
      <table-filter-header
        :column
        label="Draws"
      />
    </template>

    <template #doubles_draws-cell="{ row }">
      <div class="space-x-1">
        <template
          v-for="draw in row.original.doubles.draws"
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

    <template #doubles_seed-header="{ column }">
      <table-sort-header
        :column
        label="Seed"
      />
    </template>

    <template #doubles_statuses-header="{ column }">
      <table-filter-header
        :column
        label="Statuses"
      />
    </template>

    <template #doubles_rank-header="{ column }">
      <table-sort-header
        :column
        label="Rank"
      />
    </template>

    <template #doubles_rank-cell="{ row }">
      <form-input-number
        v-if="row.original.doubles.id && row.original.doubles.id in updatedMapping"
        v-model="updatedMapping[row.original.doubles.id]"
        placeholder="Rank"
      />

      <template v-else>{{ row.original.doubles.rank?.toLocaleString() }}</template>
    </template>

    <template #doubles_points-cell="{ row }">
      <form-input-number
        v-if="row.original.doubles.entry_id && row.original.doubles.entry_id in updatedEntries"
        v-model="updatedEntries[row.original.doubles.entry_id].points"
        placeholder="Points"
      />

      <template v-else>{{ row.original.doubles.points?.toLocaleString() }}</template>
    </template>

    <template #doubles_pm-cell="{ row }">
      <form-input-number
        v-if="row.original.doubles.entry_id && row.original.doubles.entry_id in updatedEntries"
        v-model="updatedEntries[row.original.doubles.entry_id].pm"
        placeholder="PM"
        :currency="row.original.currency"
      />

      <template v-else>{{
        row.original.doubles.pm?.toLocaleString("en-GB", { style: "currency", currency: row.original.currency || "USD" })
      }}</template>
    </template>
  </u-table>
</template>
