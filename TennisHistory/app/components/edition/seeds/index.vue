<script setup lang="ts">
import { getColumnFilter, ICONS, setColumnFilter } from "#imports"
import type { TableColumn } from "@nuxt/ui"
import type { ColumnFiltersState, Row } from "@tanstack/vue-table"
import { isDefined, set, useArrayUnique } from "@vueuse/core"

interface UpdatedSeeds {
  [key: string]: number | null
}

interface BaseChartData {
  seed: number
}

type ChartData = BaseChartData & {
  [key: string]: number | null
}

const route = useRoute("edition")
const router = useRouter()
const supabase = useSupabaseClient()
const toast = useToast()
const { ui } = useAppConfig()

const { isAdmin } = useAuthState()
const tournamentStore = useTournamentStore()

const updatedSeeds = ref<UpdatedSeeds>({})
const isSaving = ref(false)

const {
  data: seeds,
  pending,
  refresh
} = await useAsyncData(
  () => `seeds-${JSON.stringify(route.params)}`,
  async () => {
    const { data, error } = await supabase
      .schema("tennis")
      .from("seed_details")
      .select(
        `
      *,
      ...entries(
        team:player_entry_mapping(
          player_order,
          country(*),
          ...player(id, image_url, ...people(full_name))
        )
      )
    `
      )
      .eq("tournament_id", route.params.id)
      .eq("edition_no", Number(route.params.edition_no))
      .eq("year", Number(route.params.year))

    if (error || !data) {
      console.error("Error fetching seeds:", error)
      return []
    }

    return data.map(seed => ({
      ...seed,
      team: seed.team?.sort((a, b) => a.player_order - b.player_order)
    }))
  },
  { default: () => [] }
)
type SeedType = (typeof seeds.value)[number]

const multipleTours = computed(() => new Set(seeds.value.map(s => s.tour)).size > 1)

const columns: Array<TableColumn<SeedType>> = [
  { id: "checkbox" },
  { accessorKey: "tour", header: "Tour" },
  { accessorKey: "match_type", header: "S/D" },
  { accessorKey: "draw", header: "Draw" },
  { accessorKey: "seed", header: "Seed" },
  { id: "team", header: "Team" },
  { accessorKey: "rank", header: "Rank" }
]

const columnFilters = ref<ColumnFiltersState>([])

const columnVisibility = computed(() => ({
  checkbox: isAdmin.value,
  tour: tournamentStore.tours.length > 1
}))

const handleSave = async () => {
  set(isSaving, true)

  const errors: UpdatedSeeds = {}

  for (const [seedId, rank] of Object.entries(updatedSeeds.value)) {
    const { error } = await supabase.schema("tennis").from("seeds").update({ rank }).eq("id", Number(seedId))

    if (error) {
      console.error("Error updating seed:", error)
      errors[seedId] = rank
    }
  }

  const hasErrors = Object.keys(errors).length > 0

  toast.add({
    title: hasErrors ? "Error updating seeds" : "Seeds successfully updated",
    icon: ui.icons[hasErrors ? "error" : "success"],
    color: hasErrors ? "error" : "success"
  })

  set(updatedSeeds, hasErrors ? errors : {})
  set(isSaving, false)
  refresh()
}

const chartData = computed<ChartData[]>(() => {
  const allSeeds = seeds.value as SeedType[]
  const uniqueSeeds = useArrayUnique(allSeeds.map(s => s.seed)).value.sort((a, b) => (a || 9999) - (b || 9999))

  return uniqueSeeds.map(s => {
    const matchingSeeds = allSeeds.filter(seed => (seed.seed || 9999) === s)

    const seed: ChartData = {
      seed: s!
    }

    matchingSeeds.forEach(se => {
      if (se.seed && isDefined(se.rank)) {
        seed[`${se.tour} - ${se.match_type} - ${se.draw}`] = se.rank
      }
    })

    return seed
  })
})

const chartCategories = computed(() => {
  const categories: ChartCategory[] = []

  const firstItem = chartData.value[0]

  if (firstItem) {
    const itemCategories = Object.keys(firstItem).filter(k => k !== "seed")

    itemCategories.forEach(c => {
      const [tour, match_type, draw] = c.split(" - ")

      categories.push({
        label: multipleTours.value ? c : `${match_type} - ${draw}`,
        key: c,
        color: CHART_COLOURS[c as keyof typeof CHART_COLOURS]
      })
    })
  }

  return categories
})
</script>

<template>
  <u-container class="max-w-6xl my-6 space-y-6">
    <u-chart
      v-if="seeds.length"
      type="bar"
      :data="chartData"
      index="seed"
      :categories="chartCategories"
      x-label="Seed"
      y-label="Rank"
      :height="400"
    />

    <div class="flex justify-end gap-3">
      <!--Tour filter-->
      <u-select-menu
        v-if="tournamentStore.tours.length > 1"
        :items="tournamentStore.tours"
        placeholder="Tour"
        clear
        :model-value="<TourEnum>getColumnFilter('tour', columnFilters)"
        @update:model-value="columnFilters = setColumnFilter('tour', $event, columnFilters)"
      />

      <!--Match type filter-->
      <u-select-menu
        :items="['Singles', 'Doubles']"
        placeholder="S/D"
        clear
        :model-value="<MatchTypeEnum>getColumnFilter('match_type', columnFilters)"
        @update:model-value="columnFilters = setColumnFilter('match_type', $event, columnFilters)"
      />

      <!--Draw filter-->
      <u-select-menu
        :items="['Main', 'Qualifying']"
        placeholder="Draw"
        clear
        :model-value="<DrawEnum>getColumnFilter('draw', columnFilters)"
        @update:model-value="columnFilters = setColumnFilter('draw', $event, columnFilters)"
      />

      <u-field-group v-if="isAdmin">
        <lazy-edition-seeds-create
          hydrate-on-idle
          @refresh="refresh"
        />

        <u-button
          :icon="ui.icons.reload"
          @click="refresh()"
        />

        <u-button
          :icon="ICONS.save"
          :loading="isSaving"
          :loading-icon="ICONS.uploading"
          @click="handleSave"
        />
      </u-field-group>
    </div>

    <u-table
      :data="seeds"
      :columns
      :loading="pending"
      v-model:column-visibility="columnVisibility"
      v-model:column-filters="columnFilters"
      sticky
      render-fallback-value="—"
      :meta="{
        class: {
          tr: row => (row.original.draw === 'Qualifying' ? 'bg-elevated/50' : '')
        }
      }"
    >
      <template #loading>
        <loading-icon />
      </template>

      <template #empty>
        <empty
          :title="`${tournamentStore.name} ${route.params.year} had no seeds`"
          @refresh="refresh"
          class="mx-2"
        />
      </template>

      <template #checkbox-header="{ table }">
        <u-checkbox
          :model-value="
            Object.keys(updatedSeeds).length === table.getFilteredRowModel().rows.length ? true
            : Object.keys(updatedSeeds).length ? 'indeterminate'
            : false
          "
          @update:model-value="
            () => {
              if (Object.keys(updatedSeeds).length) {
                updatedSeeds = {}
              } else {
                table.getFilteredRowModel().rows.map(seed => (updatedSeeds[seed.original.id!] = seed.original.rank))
              }
            }
          "
          :icon="ICONS.ranking"
        />
      </template>

      <template #checkbox-cell="{ row }">
        <u-checkbox
          :model-value="row.original.id! in updatedSeeds"
          @update:model-value="
            () => {
              if (row.original.id! in updatedSeeds) {
                delete updatedSeeds[row.original.id!]
              } else {
                updatedSeeds[row.original.id!] = row.original.rank
              }
            }
          "
          :icon="ICONS.ranking"
        />
      </template>

      <template #team-cell="{ row }">
        <player-link
          v-if="row.original.team"
          :team="row.original.team"
          :class="{ 'line-through': row.original.withdrawn }"
        />
      </template>

      <template #rank-cell="{ row }">
        <form-input-number
          v-if="row.original.id! in updatedSeeds"
          v-model="updatedSeeds[row.original.id!]"
          placeholder="Rank"
          class="max-w-25"
        />

        <div
          v-else
          :class="{ 'line-through': row.original.withdrawn }"
        >
          {{ isDefined(row.original.rank) ? row.original.rank.toLocaleString() : "—" }}
        </div>
      </template>
    </u-table>
  </u-container>
</template>
