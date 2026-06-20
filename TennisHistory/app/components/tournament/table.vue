<script setup lang="ts">
import type { TableColumn, TableRow } from "@nuxt/ui"
import { LazyTournamentCreate, UButton, UFieldGroup } from "#components"

const props = defineProps<{
  tournaments: Array<TournamentInterface>
  pending: boolean
  count: number
  canLoadMore: boolean
}>()

const emits = defineEmits<{
  "load-more": []
  refresh: []
}>()

const route = useRoute()

const {
  ui: { icons }
} = useAppConfig()

const { isAdmin } = useAuthState()
const updateRouteQuery = useRouteQueryUpdater()

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
    footer: () => {
      if (isAdmin.value) {
        return h(UFieldGroup, { class: "w-fit" }, () => [
          h(UButton, { icon: icons.reload, onClick: () => emits("refresh") }),
          h(LazyTournamentCreate, { hydrateOnIdle: true })
        ])
      }
    }
  },
  { accessorKey: "name", footer: () => `${props.count.toLocaleString()} tournament${props.count === 1 ? "" : "s"}` },
  { accessorKey: "established" },
  { accessorKey: "abolished" }
]

const getSortingIcon = (field: string) => {
  const currentSort = route.query.sort

  if (!currentSort) return ICONS.sort

  const [currentField, currentDirection] = (currentSort as string).split("-")

  if (currentField !== field) return ICONS.sort

  return currentDirection === "asc" ? ICONS.sortAsc : ICONS.sortDesc
}

const handleSorting = (field: string) => {
  const currentSort = route.query.sort

  if (currentSort) {
    const [currentField, currentDirection] = (currentSort as string).split("-")

    if (currentField === field) {
      if (currentDirection === "asc") {
        updateRouteQuery("sort", `${field}-desc`)
      } else {
        updateRouteQuery("sort", null)
      }
    } else {
      updateRouteQuery("sort", `${field}-asc`)
    }
  } else {
    updateRouteQuery("sort", `${field}-asc`)
  }
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
  <u-table
    ref="table"
    :data="tournaments"
    :columns
    sticky
    :loading="pending"
    @select="handleSelectRow"
    render-fallback-value="—"
    :ui="{
      root: '2xl:max-w-2/3 mx-auto',
      tbody: '[&>tr]:data-[selectable=true]:cursor-pointer [&>tr]:data-[selectable=true]:hover:bg-elevated/50 [&>tr]:even:bg-elevated/25'
    }"
  >
    <template #loading>
      <loading-icon />
    </template>

    <template #empty>
      <empty
        :icon="ICONS.trophyOff"
        title="No tournaments found"
        @refresh="$emit('refresh')"
        class="mx-2"
      />
    </template>

    <template #tours-header>
      <u-select
        :model-value="<Array<TourType>>route.query.tour"
        @update:model-value="updateRouteQuery('tour', $event)"
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
      <u-button
        variant="ghost"
        color="neutral"
        label="Tournament"
        :icon="getSortingIcon('name')"
        @click="handleSorting('name')"
      />
    </template>

    <template #established-header>
      <div class="flex items-center gap-0.5 w-fit mx-auto">
        <u-select-menu
          :model-value="<string>route.query.established ? Number(route.query.established) : undefined"
          @update:model-value="updateRouteQuery('established', $event)"
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
          @click="handleSorting('established')"
        />
      </div>
    </template>

    <template #abolished-header>
      <div class="flex items-center gap-0.5 w-fit mx-auto">
        <u-select-menu
          :model-value="<string>route.query.abolished ? Number(route.query.abolished) : undefined"
          @update:model-value="updateRouteQuery('abolished', $event)"
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
          @click="handleSorting('abolished')"
        />
      </div>
    </template>
  </u-table>
</template>
