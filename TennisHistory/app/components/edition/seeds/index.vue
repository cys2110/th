<script setup lang="ts">
import { ICONS, MatchTypeEnum, TourEnum } from "#imports"
import type { TableColumn } from "@nuxt/ui"
import type { ColumnFiltersState } from "@tanstack/vue-table"
import { isDefined, set } from "@vueuse/core"

const route = useRoute("edition")
const supabase = useSupabaseClient()
const toast = useToast()
const { ui } = useAppConfig()

const { isAdmin } = useAuthState()
const tournamentStore = useTournamentStore()

const updatedSeeds = ref<{ [key: string]: number | null }>({})
const isSaving = ref(false)
const columnFilters = ref<ColumnFiltersState>([])

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

    return data
  },
  { default: () => [] }
)
type SeedType = (typeof seeds.value)[number]

const columns: Array<TableColumn<SeedType>> = [
  { id: "checkbox" },
  { accessorKey: "tour", header: "Tour", filterFn: "equals" },
  { accessorKey: "match_type", header: "S/D", filterFn: "equals" },
  { accessorKey: "draw", header: "Draw", filterFn: "equals" },
  { accessorKey: "seed", header: "Seed" },
  { id: "team", header: "Team" },
  { accessorKey: "rank", header: "Rank" }
]

const columnVisibility = computed(() => ({
  checkbox: isAdmin.value,
  tour: tournamentStore.tours.length > 1
}))

const getColumnFilter = (id: string) => columnFilters.value.find(filter => filter.id === id)?.value

const setColumnFilter = (id: string, value: unknown) => {
  columnFilters.value = [...columnFilters.value.filter(filter => filter.id !== id), ...(isDefined(value) && value !== "" ? [{ id, value }] : [])]
}

const handleSave = async () => {
  set(isSaving, true)

  try {
    const errors: Record<string, number | null> = {}

    for (const [seedId, rank] of Object.entries(updatedSeeds.value)) {
      const { error } = await supabase.schema("tennis").from("seeds").update({ rank }).eq("id", seedId)

      if (error) {
        console.error("Error updating seed:", error)
        errors[seedId] = rank
      }
    }

    if (Object.keys(errors).length) {
      toast.add({
        title: "Error updating seeds",
        icon: ui.icons.error,
        color: "error"
      })
      set(updatedSeeds, errors)
    } else {
      toast.add({
        title: "Seeds successfully updated",
        icon: ui.icons.success,
        color: "success"
      })

      set(updatedSeeds, {})
    }
  } finally {
    refresh()
    set(isSaving, false)
  }
}
</script>

<template>
  <u-container class="max-w-6xl my-6 space-y-6">
    <div class="flex justify-end gap-3">
      <!--Tour filter-->
      <u-select-menu
        v-if="tournamentStore.tours.length > 1"
        :items="tournamentStore.tours"
        placeholder="Tour"
        clear
        :model-value="<TourEnum>getColumnFilter('tour')"
        @update:model-value="setColumnFilter('tour', $event)"
      />

      <!--Match type filter-->
      <u-select-menu
        :items="['Singles', 'Doubles']"
        placeholder="S/D"
        clear
        :model-value="<MatchTypeEnum>getColumnFilter('match_type')"
        @update:model-value="setColumnFilter('match_type', $event)"
      />

      <!--Draw filter-->
      <u-select-menu
        :items="['Main', 'Qualifying']"
        placeholder="Draw"
        clear
        :model-value="<DrawEnum>getColumnFilter('draw')"
        @update:model-value="setColumnFilter('draw', $event)"
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
      v-model:column-visibility="columnVisibility"
      v-model:column-filters="columnFilters"
      :data="seeds"
      :columns
      :loading="pending"
      sticky
      render-fallback-value="—"
      :meta="{
        class: {
          tr: row => (row.original.draw === 'Qualifying' ? 'bg-elevated' : '')
        }
      }"
      class="max-h-[58vh]"
    >
      <template #loading>
        <loading-icon />
      </template>

      <template #empty>
        <empty :title="`${tournamentStore.name} ${route.params.year} had no seeds`" />
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
