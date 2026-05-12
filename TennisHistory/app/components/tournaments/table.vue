<script setup lang="ts">
import { LazyTournamentCreate, UButton, UFieldGroup } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"

const props = defineProps<{
  tournaments: Array<TournamentInterface>
  pending: boolean
  canLoadMore: boolean
  sorting: Array<SortingInterface>
}>()

const emits = defineEmits<{
  "load-more": []
  "handle-sorting": [string]
  refresh: []
}>()

const {
  ui: { icons }
} = useAppConfig()

const { dev } = useRuntimeConfig().public

const filters = defineModel<TournamentFiltersInterface>("filters")

const { results, loading, searchTerm } = useTournamentSearch()

const router = useRouter()

const table = useTemplateRef("table")

onMounted(() => {
  useInfiniteScroll(table.value?.$el, () => emits("load-more"), {
    distance: 10,
    canLoadMore: () => props.canLoadMore
  })
})

const columns: Array<TableColumn<TournamentInterface>> = [
  {
    accessorKey: "tours",
    ...(dev && {
      footer: () =>
        h(UFieldGroup, { class: "w-fit" }, () => [
          h(UButton, { icon: icons.reload, onClick: () => emits("refresh") }),
          h(LazyTournamentCreate, { hydrateOnIdle: true, onRefresh: () => emits("refresh") })
        ])
    })
  },
  { accessorKey: "name" },
  { accessorKey: "established" },
  { accessorKey: "abolished" }
]

const getSortingIcon = (field: string) => {
  const currentSort = props.sorting.find(sort => sort.field === field)

  if (!currentSort) return ICONS.sort

  return currentSort.direction ? ICONS.sortAsc : ICONS.sortDesc
}

const handleSelectRow = (_e: Event, row: TableRow<TournamentInterface>) => {
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
  <u-theme :ui="{ button: { leadingIcon: 'size-5' } }">
    <u-table
      ref="table"
      :data="tournaments"
      :columns
      sticky
      :loading="pending"
      @select="handleSelectRow"
      render-fallback-value="—"
      class="2xl:max-w-2/3 mx-auto"
      :meta="{
        class: {
          tr: row => {
            if ((row.original.tours || []).length > 1) {
              return 'bg-primary/20'
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
                  return 'bg-primary/20'
              }
            }
          }
        }
      }"
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
          title="No tournaments found"
          description="If you think this is an error, refresh the page. Otherwise, please be patient as we continue to add more data."
          class="mx-2"
        >
          <template #actions>
            <u-button
              label="Refresh"
              :icon="icons.reload"
              @click="$emit('refresh')"
            />
          </template>
        </u-empty>
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
            :color="tour"
          />
        </div>
      </template>

      <template #name-header>
        <div class="flex justify-center items-center gap-0.5">
          <u-select-menu
            v-if="filters"
            placeholder="Tournament"
            clear
            :items="results"
            v-model="filters.tournaments"
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
