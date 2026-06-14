<script setup lang="ts">
import { LazyPlayerCreate, UButton, UFieldGroup } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"

const props = defineProps<{
  players: Array<PlayerListType>
  pending: boolean
  canLoadMore: boolean
  countries: Array<CountryInterface & { icon: string }>
  countriesPending: boolean
  count: number
}>()

const emits = defineEmits<{
  "load-more": []
  refresh: []
}>()

const route = useRoute("players")
const router = useRouter()

const {
  ui: { icons }
} = useAppConfig()

const { isAdmin } = useAuthState()
const updateRouteQuery = useRouteQueryUpdater()

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
        :model-value="<TourType>route.query.tour"
        @update:model-value="updateRouteQuery('tour', $event)"
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
        :model-value="<string>route.query.country"
        @update:model-value="updateRouteQuery('country', $event)"
        :items="countries"
        value-key="id"
        label-key="name"
        placeholder="Country"
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
      <u-button
        variant="ghost"
        color="neutral"
        :trailing-icon="getSortingIcon('name')"
        label="Player"
        @click="handleSorting('name')"
      />
    </template>

    <template #turned_pro-header>
      <div class="flex justify-center items-center gap-0.5">
        <u-select-menu
          :model-value="<string>route.query.turned_pro ? Number(route.query.turned_pro) : null"
          @update:model-value="updateRouteQuery('turned_pro', $event)"
          :items="OPEN_ERA_YEARS"
          :icon="ICONS.years"
          placeholder="Turned pro"
          variant="none"
          clear
        />
        <u-button
          variant="ghost"
          color="neutral"
          :trailing-icon="getSortingIcon('turned_pro')"
          @click="handleSorting('turned_pro')"
        />
      </div>
    </template>

    <template #retired-header>
      <div class="flex justify-center items-center gap-0.5">
        <u-select-menu
          :model-value="<string>route.query.retired ? Number(route.query.retired) : null"
          @update:model-value="updateRouteQuery('retired', $event)"
          :items="OPEN_ERA_YEARS"
          :icon="ICONS.years"
          placeholder="Retired"
          variant="none"
          clear
        />
        <u-button
          variant="ghost"
          color="neutral"
          :trailing-icon="getSortingIcon('retired')"
          @click="handleSorting('retired')"
        />
      </div>
    </template>

    <template #first_tournament-header>
      <div class="flex justify-center items-center gap-0.5">
        <u-select-menu
          :model-value="<string>route.query.first_tournament ? Number(route.query.first_tournament) : null"
          @update:model-value="updateRouteQuery('first_tournament', $event)"
          :items="OPEN_ERA_YEARS"
          :icon="ICONS.years"
          placeholder="First Tournament Played"
          variant="none"
          clear
        />
        <u-button
          variant="ghost"
          color="neutral"
          :trailing-icon="getSortingIcon('first_tournament')"
          @click="handleSorting('first_tournament')"
        />
      </div>
    </template>

    <template #last_tournament-header>
      <div class="flex justify-center items-center gap-0.5">
        <u-select-menu
          :model-value="<string>route.query.last_tournament ? Number(route.query.last_tournament) : null"
          @update:model-value="updateRouteQuery('last_tournament', $event)"
          :items="OPEN_ERA_YEARS"
          :icon="ICONS.years"
          placeholder="Last Tournament Played"
          variant="none"
          clear
        />
        <u-button
          variant="ghost"
          color="neutral"
          :trailing-icon="getSortingIcon('last_tournament')"
          @click="handleSorting('last_tournament')"
        />
      </div>
    </template>
  </u-table>
</template>
