<script setup lang="ts">
import { UBadge } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import { createColumnHelper, getFacetedRowModel, getFacetedUniqueValues } from "@tanstack/vue-table"

const props = defineProps<{
  refresh: number
}>()

const {
  params: { id, edId }
} = useRoute("edition")

const {
  ui: { colors, icons }
} = useAppConfig()

const runtimeConfig = useRuntimeConfig()

const router = useRouter()

const toast = useToast()

const supabase = useSupabaseClient()
const isSaving = ref(false)

const updatedEntries = ref<Record<string, any>>({})

const {
  data: entries,
  pending,
  refresh: refreshEntries
} = await useAsyncData<Array<IndividualPlayerEntryInterface>>(
  "individual-players",
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
          entry_id: singlesEntry?.id,
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
          entry_id: doublesEntry?.id,
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

watch(
  () => props.refresh,
  () => {
    refreshEntries()
  }
)

watch(
  () => entries.value,
  () => {
    updatedEntries.value = Object.fromEntries(
      entries.value.map(entry => [
        entry.id,
        {
          singles: {
            entry_id: entry.singles.entry_id,
            pem_id: entry.singles.id,
            points: undefined,
            pm: undefined,
            rank: undefined
          },
          doubles: {
            entry_id: entry.doubles.entry_id,
            pem_id: entry.doubles.id,
            points: undefined,
            pm: undefined,
            rank: undefined
          }
        }
      ])
    )
  },
  { immediate: true }
)

const columnVisibility = computed(() => {
  return {
    singles_draws: COUNTRY_DRAWS.includes(id) ? false : true,
    singles_seed: COUNTRY_DRAWS.includes(id) ? false : true,
    singles_statuses: COUNTRY_DRAWS.includes(id) ? false : true,
    singles_pm: runtimeConfig.public.dev ? true : false,
    singles_points: runtimeConfig.public.dev ? true : false,
    doubles_draws: COUNTRY_DRAWS.includes(id) ? false : true,
    doubles_seed: COUNTRY_DRAWS.includes(id) ? false : true,
    doubles_statuses: COUNTRY_DRAWS.includes(id) ? false : true,
    doubles_pm: runtimeConfig.public.dev ? true : false,
    doubles_points: runtimeConfig.public.dev ? true : false
  }
})

const columnHelper = createColumnHelper<IndividualPlayerEntryInterface>()
const columns: TableColumn<IndividualPlayerEntryInterface>[] = [
  { accessorKey: "tour" },
  { id: "player", accessorFn: row => `${row.last_name}, ${row.first_name}` },
  columnHelper.group({
    id: "singles",
    header: () => h(UBadge, { label: "Singles", color: "Singles", class: "w-full" }),
    columns: [
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
      {
        accessorKey: "singles.statuses",
        filterFn: (row, columnId, filterValue) => {
          const values = (row.getValue(columnId) as string[]) || []

          if (!filterValue?.length) return true
          if (values.some(v => filterValue.includes(v))) return true
          return false
        }
      },
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
      {
        accessorKey: "doubles.statuses",
        filterFn: (row, columnId, filterValue) => {
          const values = (row.getValue(columnId) as string[]) || []

          if (!filterValue?.length) return true
          if (values.some(v => filterValue.includes(v))) return true
          return false
        }
      },
      { accessorKey: "doubles.rank" },
      { accessorKey: "doubles.points", header: "Points" },
      { accessorKey: "doubles.pm", header: "PM" }
    ]
  })
]

const handleSelectRow = (_e: Event, row: TableRow<IndividualPlayerEntryInterface>) => {
  if (!runtimeConfig.public.dev) {
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
  for (const [id, entry] of Object.entries(updatedEntries.value)) {
    if ("rank" in entry.singles) {
      const { error } = await supabase.from("player_entry_mapping").update({ rank: entry.singles.rank }).eq("id", entry.singles.pem_id)

      if (error) {
        console.error(`Error updating rank for ${id}:`, error)
      }
    }

    if ("rank" in entry.doubles) {
      const { error } = await supabase.from("player_entry_mapping").update({ rank: entry.doubles.rank }).eq("id", entry.doubles.pem_id)

      if (error) {
        console.error(`Error updating rank for ${id}:`, error)
      }
    }

    if ("points" in entry.singles || "pm" in entry.singles) {
      const updateObject: Record<string, number> = {}

      if ("points" in entry.singles) updateObject.points = entry.singles.points
      if ("pm" in entry.singles) updateObject.pm = entry.singles.pm

      const { error } = await supabase.from("entries").update(updateObject).eq("id", entry.singles.entry_id)

      if (error) {
        console.error(`Error updating points/pm for ${id}:`, error)
      }
    }

    if ("points" in entry.doubles || "pm" in entry.doubles) {
      const updateObject: Record<string, number> = {}

      if ("points" in entry.doubles) updateObject.points = entry.doubles.points
      if ("pm" in entry.doubles) updateObject.pm = entry.doubles.pm

      const { error } = await supabase.from("entries").update(updateObject).eq("id", entry.doubles.entry_id)

      if (error) {
        console.error(`Error updating points/pm for ${id}:`, error)
      }
    }
  }

  set(isSaving, false)
  toast.add({
    title: "Entries updated successfully",
    icon: icons.success,
    color: "success"
  })
  refreshEntries()
}
</script>

<template>
  <dev-only>
    <div class="flex justify-end">
      <u-button
        :icon="ICONS.save"
        color="warning"
        @click="handleSave"
        :loading="isSaving"
        :loading-icon="ICONS.uploading"
      />
    </div>
  </dev-only>
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
    :ui="{ td: 'px-2' }"
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

    <template #player-header="{ column }">
      <div class="flex justify-center items-center gap-0.5">
        <table-client-name-filter-header
          :column
          label="Player"
        />
        <table-client-sort-header :column />
      </div>
    </template>

    <template #player-cell="{ row }">
      <player-link :player="row.original" />
    </template>

    <template #singles_draws-header="{ column }">
      <table-client-filter-header
        :column
        label="Draws"
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
      <table-client-sort-header
        :column
        label="Seed"
      />
    </template>

    <template #singles_statuses-header="{ column }">
      <table-client-filter-header
        :column
        label="Statuses"
      />
    </template>

    <template #singles_rank-header="{ column }">
      <table-client-sort-header
        :column
        label="Rank"
      />
    </template>

    <template #singles_rank-cell="{ row }">
      <dev-only>
        <u-input-number
          :default-value="row.original.singles?.rank ?? undefined"
          :model-value="updatedEntries[row.original.id].singles.rank"
          @update:model-value="updatedEntries[row.original.id].singles.rank = $event"
          placeholder="Enter rank"
          :decrement="false"
          class="min-w-25"
        >
          <template #increment>
            <u-button
              v-if="isDefined(updatedEntries[row.original.id].singles.rank)"
              color="neutral"
              variant="link"
              :icon="icons.close"
              aria-label="Clear input"
              @click="updatedEntries[row.original.id].singles.rank = null"
            />
            <template v-else>{{ " " }}</template>
          </template>
        </u-input-number>

        <template #fallback>
          {{ row.original.doubles?.rank?.toLocaleString() }}
        </template>
      </dev-only>
    </template>

    <template #singles_points-cell="{ row }">
      <u-input-number
        :default-value="row.original.singles?.points ?? undefined"
        :model-value="updatedEntries[row.original.id].singles.points"
        @update:model-value="updatedEntries[row.original.id].singles.points = $event"
        placeholder="Enter points"
        :decrement="false"
        class="min-w-25"
      >
        <template #increment>
          <u-button
            v-if="isDefined(updatedEntries[row.original.id].singles.points)"
            color="neutral"
            variant="link"
            :icon="icons.close"
            aria-label="Clear input"
            @click="updatedEntries[row.original.id].singles.points = null"
          />
          <template v-else>{{ " " }}</template>
        </template>
      </u-input-number>
    </template>

    <template #singles_pm-cell="{ row }">
      <u-input-number
        :default-value="row.original.singles?.pm ?? undefined"
        :model-value="updatedEntries[row.original.id].singles.pm"
        @update:model-value="updatedEntries[row.original.id].singles.pm = $event"
        placeholder="Enter pm"
        :decrement="false"
        :step="0.01"
        :format-options="{ style: 'currency', currency: row.original.currency }"
        class="min-w-25"
      >
        <template #increment>
          <u-button
            v-if="isDefined(updatedEntries[row.original.id].singles.pm)"
            color="neutral"
            variant="link"
            :icon="icons.close"
            aria-label="Clear input"
            @click="updatedEntries[row.original.id].singles.pm = null"
          />
          <template v-else>{{ " " }}</template>
        </template>
      </u-input-number>
    </template>

    <template #doubles_draws-header="{ column }">
      <table-client-filter-header
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
      <table-client-sort-header
        :column
        label="Seed"
      />
    </template>

    <template #doubles_statuses-header="{ column }">
      <table-client-filter-header
        :column
        label="Statuses"
      />
    </template>

    <template #doubles_rank-header="{ column }">
      <table-client-sort-header
        :column
        label="Rank"
      />
    </template>

    <template #doubles_rank-cell="{ row }">
      <dev-only>
        <u-input-number
          :default-value="row.original.doubles?.rank ?? undefined"
          :model-value="updatedEntries[row.original.id].doubles.rank"
          @update:model-value="updatedEntries[row.original.id].doubles.rank = $event"
          placeholder="Enter rank"
          :decrement="false"
          class="min-w-25"
        >
          <template #increment>
            <u-button
              v-if="isDefined(updatedEntries[row.original.id].doubles.rank)"
              color="neutral"
              variant="link"
              :icon="icons.close"
              aria-label="Clear input"
              @click="updatedEntries[row.original.id].doubles.rank = null"
            />
            <template v-else>{{ " " }}</template>
          </template>
        </u-input-number>

        <template #fallback>
          {{ row.original.doubles?.rank?.toLocaleString() }}
        </template>
      </dev-only>
    </template>

    <template #doubles_points-cell="{ row }">
      <u-input-number
        :default-value="row.original.doubles?.points ?? undefined"
        :model-value="updatedEntries[row.original.id].doubles.points"
        @update:model-value="updatedEntries[row.original.id].doubles.points = $event"
        placeholder="Enter points"
        :decrement="false"
        class="min-w-25"
      >
        <template #increment>
          <u-button
            v-if="isDefined(updatedEntries[row.original.id].doubles.points)"
            color="neutral"
            variant="link"
            :icon="icons.close"
            aria-label="Clear input"
            @click="updatedEntries[row.original.id].doubles.points = null"
          />
          <template v-else>{{ " " }}</template>
        </template>
      </u-input-number>
    </template>

    <template #doubles_pm-cell="{ row }">
      <u-input-number
        :default-value="row.original.doubles?.pm ?? undefined"
        :model-value="updatedEntries[row.original.id].doubles.pm"
        @update:model-value="updatedEntries[row.original.id].doubles.pm = $event"
        placeholder="Enter pm"
        :decrement="false"
        :step="0.01"
        :format-options="{ style: 'currency', currency: row.original.currency }"
        class="min-w-25"
      >
        <template #increment>
          <u-button
            v-if="isDefined(updatedEntries[row.original.id].doubles.pm)"
            color="neutral"
            variant="link"
            :icon="icons.close"
            aria-label="Clear input"
            @click="updatedEntries[row.original.id].doubles.pm = null"
          />
          <template v-else>{{ " " }}</template>
        </template>
      </u-input-number>
    </template>
  </u-table>
</template>
