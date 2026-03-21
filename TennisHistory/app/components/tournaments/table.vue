<script setup lang="ts">
import type { TableColumn, TableRow } from "@nuxt/ui"

const props = defineProps<{
  tournaments: Array<TournamentType>
  pending: boolean
  canLoadMore: boolean
  sorting: Array<SortingInterface>
}>()

const emits = defineEmits<{
  "load-more": []
  "handle-sorting": [string]
}>()

const filters = defineModel<TournamentFiltersInterface>("filters")

const tournamentStore = useTournamentStore()

const { results, loading, searchTerm, tournamentFilters } = useTournamentSearch()

const router = useRouter()

const {
  ui: { colors }
} = useAppConfig()

const table = useTemplateRef("table")

onMounted(() => {
  useInfiniteScroll(table.value?.$el, () => emits("load-more"), {
    distance: 10,
    canLoadMore: () => props.canLoadMore
  })
})

const columns: Array<TableColumn<TournamentType>> = [
  { accessorKey: "tours" },
  { accessorKey: "name" },
  { accessorKey: "established" },
  { accessorKey: "abolished" }
]

const getSortingIcon = (field: string) => {
  const currentSort = props.sorting.find(sort => sort.field === field)

  if (!currentSort) return ICONS.sort

  return currentSort.direction ? ICONS.sortAsc : ICONS.sortDesc
}

const handleSelectRow = (_e: Event, row: TableRow<TournamentType>) => {
  const { id, name } = row.original

  router.push({
    name: "tournament",
    params: {
      id,
      name: kebabCase(name)
    }
  })
}
</script>

<template>
  <u-theme
    :ui="{
      select: {
        base: 'w-fit mx-auto'
      },
      selectMenu: {
        base: 'w-fit mx-auto'
      },
      button: {
        leadingIcon: 'size-5'
      }
    }"
  >
    <u-table
      ref="table"
      :data="tournaments"
      :columns
      sticky
      :loading="pending"
      @select="handleSelectRow"
      render-fallback-value="—"
      :meta="{
        class: {
          tr: row => {
            if ((row.original.tours || []).length > 1) {
              return 'bg-primary/10'
            } else {
              switch (row.original.tours![0]) {
                case 'ATP':
                  return 'bg-ATP/10'
                case 'WTA':
                  return 'bg-WTA/10'
                case 'ITF-M':
                  return 'bg-ITF-M/10'
                case 'ITF-W':
                  return 'bg-ITF-W/10'
                default:
                  return 'bg-primary/10'
              }
            }
          }
        }
      }"
    >
      <template #loading>
        <loading-icon />
      </template>

      <template #empty>
        <empty
          message="No tournaments found"
          :icon="ICONS.trophyOff"
        />
      </template>

      <template #tours-header>
        <u-select
          v-if="filters"
          v-model="filters.tours"
          :items="[...TOUR_OPTIONS]"
          placeholder="Tour"
          multiple
          clear
          variant="none"
          :icon="ICONS.tour"
        />
      </template>

      <template #tours-cell="{ row }">
        <div class="space-x-1">
          <u-badge
            v-for="tour in row.original.tours"
            :key="tour"
            :label="tour"
            :color="<keyof typeof colors>tour"
          />
        </div>
      </template>

      <template #name-header>
        <div class="flex items-center gap-0.5">
          <u-select-menu
            placeholder="Tournament"
            clear
            :items="results"
            v-model="tournamentFilters"
            multiple
            :icon="ICONS.trophy"
            :loading
            v-model:search-term="searchTerm"
            variant="none"
          />
          <u-button
            variant="ghost"
            color="neutral"
            :icon="getSortingIcon('name')"
            @click="() => $emit('handle-sorting', 'name')"
          />
        </div>
      </template>

      <template #established-header>
        <div class="flex items-center gap-0.5">
          <u-select-menu
            v-if="filters"
            v-model="filters.established"
            :items="ALL_YEARS"
            :icon="ICONS.years"
            placeholder="Established"
            variant="none"
            clear
          />
          <u-button
            variant="ghost"
            color="neutral"
            :icon="getSortingIcon('established')"
            @click="() => $emit('handle-sorting', 'established')"
          />
        </div>
      </template>

      <template #abolished-header>
        <div class="flex items-center gap-0.5">
          <u-select-menu
            v-if="filters"
            v-model="filters.abolished"
            :items="ALL_YEARS"
            :icon="ICONS.years"
            placeholder="Abolished"
            variant="none"
            clear
          />
          <u-button
            variant="ghost"
            color="neutral"
            :icon="getSortingIcon('abolished')"
            @click="() => $emit('handle-sorting', 'abolished')"
          />
        </div>
      </template>
    </u-table>
  </u-theme>
</template>
