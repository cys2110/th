<script setup lang="ts">
import type { TableColumn, TableRow } from "@nuxt/ui"

const props = defineProps<{
  players: Array<PlayersItemType>
  pending: boolean
  canLoadMore: boolean
  countries: Array<CountryType & { icon: string }>
  countriesPending: boolean
  sorting: Array<SortingInterface>
}>()

const emits = defineEmits<{
  "load-more": []
  "handle-sorting": [field: string]
  refresh: []
}>()

const {
  ui: { icons }
} = useAppConfig()

const filters = defineModel<PlayerFiltersInterface>("filters")

const { results, loading, searchTerm } = usePlayerSearch()

const router = useRouter()

const {
  ui: { colors }
} = useAppConfig()

const table = useTemplateRef("table")

const currentYear = new Date().getFullYear()

onMounted(() => {
  useInfiniteScroll(table.value?.$el, () => emits("load-more"), {
    distance: 10,
    canLoadMore: () => props.canLoadMore
  })
})

const columns: Array<TableColumn<PlayersItemType>> = [
  { accessorKey: "tour" },
  { accessorKey: "country" },
  { id: "name", accessorFn: row => `${row.first_name} ${row.last_name}` },
  { id: "turned_pro", accessorKey: "turned_pro" },
  { id: "retired", accessorKey: "retired" }
]

const getSortingIcon = (field: string) => {
  const currentSort = props.sorting.find(sort => sort.field === field)

  if (!currentSort) return ICONS.sort

  return currentSort.direction ? ICONS.sortAsc : ICONS.sortDesc
}

const handleSelectRow = (_e: Event, row: TableRow<PlayersItemType>) => {
  const { id, first_name, last_name } = row.original

  router.push({
    name: "player",
    params: {
      id,
      name: kebabCase(`${first_name} ${last_name}`)
    }
  })
}
</script>

<template>
  <u-theme :ui="{ button: { leadingIcon: 'size-5' } }">
    <u-table
      ref="table"
      :data="players"
      :columns
      sticky
      :loading="pending"
      @select="handleSelectRow"
      render-fallback-value="—"
      class="2xl:max-w-2/3 mx-auto"
      :meta="{
        class: {
          tr: row => (row.original.tour === 'ATP' ? 'bg-ATP/10' : 'bg-WTA/10')
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
          :icon="ICONS.peopleOff"
          title="No players found"
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

      <template #tour-header>
        <u-select
          v-if="filters"
          v-model="filters.tours"
          :items="['ATP', 'WTA']"
          placeholder="Tour"
          multiple
          variant="none"
          :icon="ICONS.tour"
        />
      </template>

      <template #tour-cell="{ cell, row }">
        <u-chip :color="!row.original.retired || currentYear > row.original.retired ? 'Active' : 'Inactive'">
          <u-badge
            :label="cell.getValue<string>()"
            :color="cell.getValue<keyof typeof colors>()"
          />
        </u-chip>
      </template>

      <template #country-header>
        <u-select-menu
          v-if="filters"
          v-model="filters.countries"
          :items="countries"
          value-key="id"
          label-key="name"
          placeholder="Country"
          multiple
          :icon="ICONS.globe"
          clear
          variant="none"
        />
      </template>

      <template #country-cell="{ cell }">
        <country-link
          v-if="cell.getValue()"
          :country="cell.getValue<CountryType>()"
          icon-only
          class="mx-auto"
        />
      </template>

      <template #name-header>
        <div class="flex items-center justify-center gap-0.5">
          <u-select-menu
            v-if="filters"
            v-model="filters.players"
            :items="results"
            placeholder="Player"
            multiple
            :icon="ICONS.player"
            clear
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

      <template #turned_pro-header>
        <div class="flex justify-center items-center gap-0.5">
          <u-select-menu
            v-if="filters"
            v-model="filters.turned_pro"
            :items="OPEN_ERA_YEARS"
            :icon="ICONS.years"
            placeholder="Turned pro"
            variant="none"
            clear
          />
          <u-button
            variant="ghost"
            color="neutral"
            :icon="getSortingIcon('turned_pro')"
            @click="() => $emit('handle-sorting', 'turned_pro')"
          />
        </div>
      </template>

      <template #retired-header>
        <div class="flex justify-center items-center gap-0.5">
          <u-select-menu
            v-if="filters"
            v-model="filters.retired"
            :items="OPEN_ERA_YEARS"
            :icon="ICONS.years"
            placeholder="Retired"
            variant="none"
            clear
          />
          <u-button
            variant="ghost"
            color="neutral"
            :icon="getSortingIcon('retired')"
            @click="() => $emit('handle-sorting', 'retired')"
          />
        </div>
      </template>
    </u-table>
  </u-theme>
</template>
