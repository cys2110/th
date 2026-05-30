<script setup lang="ts">
import { LazyPlayerCreate, UButton, UFieldGroup } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"

const props = defineProps<{
  players: Array<PlayerListType>
  pending: boolean
  canLoadMore: boolean
  countries: Array<CountryInterface & { icon: string }>
  countriesPending: boolean
  sorting: Array<SortingInterface>
  count: number
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

const { isAdmin } = useAuthState()
const { results, pending: loading, searchTerm, fetchSearchResults } = usePlayerSearch()

const router = useRouter()

const table = useTemplateRef("table")

const currentYear = new Date().getFullYear()

onMounted(() => {
  useInfiniteScroll(table.value?.$el, () => emits("load-more"), {
    distance: 10,
    canLoadMore: () => props.canLoadMore
  })
})

const columns: Array<TableColumn<PlayerListType>> = [
  {
    accessorKey: "tour",
    footer: () => {
      if (isAdmin.value) {
        return h(UFieldGroup, { class: "w-fit" }, () => [
          h(UButton, { icon: icons.reload, onClick: () => emits("refresh") }),
          h(LazyPlayerCreate, { hydrateOnIdle: true })
        ])
      }
    }
  },
  { accessorKey: "country" },
  {
    id: "name",
    accessorFn: row => `${row.first_name} ${row.last_name}`,
    footer: () => `${props.count.toLocaleString()} player${props.count === 1 ? "" : "s"}`
  },
  { accessorKey: "turned_pro" },
  { accessorKey: "retired" },
  { accessorKey: "first_tournament" },
  { accessorKey: "last_tournament" }
]

const getSortingIcon = (field: string) => {
  const currentSort = props.sorting.find(sort => sort.field === field)

  if (!currentSort) return ICONS.sort

  return currentSort.direction ? ICONS.sortAsc : ICONS.sortDesc
}

const handleSelectRow = (_e: Event, row: TableRow<PlayerListType>) => {
  const { id, full_name } = row.original

  router.push({
    name: "player",
    params: {
      id,
      name: kebabCase(full_name || "—")
    }
  })
}
</script>

<template>
  <u-table
    ref="table"
    :data="players"
    :columns
    sticky
    :loading="pending"
    @select="handleSelectRow"
    render-fallback-value="—"
    :ui="{ tbody: '[&>tr]:data-[selectable=true]:cursor-pointer [&>tr]:data-[selectable=true]:hover:bg-elevated/50 [&>tr]:even:bg-elevated/25' }"
  >
    <template #loading>
      <loading-icon />
    </template>

    <template #empty>
      <empty
        :icon="ICONS.peopleOff"
        title="No players found"
        @refresh="$emit('refresh')"
      />
    </template>

    <template #tour-header>
      <u-select
        v-if="filters"
        v-model="filters.tour"
        :items="['ATP', 'WTA']"
        placeholder="Tour"
        variant="none"
        :icon="ICONS.tour"
      />
    </template>

    <template #tour-cell="{ row }">
      <u-chip :color="row.original.last_tournament && currentYear === row.original.last_tournament ? 'Active' : 'Inactive'">
        <u-badge
          :label="row.original.tour"
          :color="row.original.tour"
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
        :country="cell.getValue<CountryInterface>()"
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
          label-key="name"
          @update:open="fetchSearchResults"
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

    <template #first_tournament-header>
      <div class="flex justify-center items-center gap-0.5">
        <u-select-menu
          v-if="filters"
          v-model="filters.first_tournament"
          :items="OPEN_ERA_YEARS"
          :icon="ICONS.years"
          placeholder="First Tournament Played"
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

    <template #last_tournament-header>
      <div class="flex justify-center items-center gap-0.5">
        <u-select-menu
          v-if="filters"
          v-model="filters.last_tournament"
          :items="OPEN_ERA_YEARS"
          :icon="ICONS.years"
          placeholder="Last Tournament Played"
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
</template>
