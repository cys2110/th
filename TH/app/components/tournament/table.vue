<script setup lang="ts">
import type { TableColumn, TableRow } from "@nuxt/ui"
import { LazyTournamentCreate, UButton, UFieldGroup } from "#components"
import { ICONS, TOUR_OPTIONS } from "#imports"
import { CalendarDate, type DateValue } from "@internationalized/date"

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
const router = useRouter()
const { ui } = useAppConfig()

const { isAdmin } = useAuthState()
const updateRouteQuery = useRouteQueryUpdater()

const table = useTemplateRef("table")

onMounted(() => {
  useInfiniteScroll(table.value?.$el, () => emits("load-more"), {
    distance: 10,
    canLoadMore: () => props.canLoadMore
  })
})

const selectedEstablishedDate = computed(() => {
  if (route.query.year) {
    return new CalendarDate(Number(route.query.year), 1, 1)
  }

  return undefined
})

const selectedAbolishedDate = computed(() => {
  if (route.query.year) {
    return new CalendarDate(Number(route.query.year), 1, 1)
  }

  return undefined
})

const columns: Array<TableColumn<TournamentInterface>> = [
  {
    accessorKey: "tours",
    footer: () => `${props.count.toLocaleString()} tournament${props.count === 1 ? "" : "s"}`
  },
  { accessorKey: "name" },
  { accessorKey: "established" },
  {
    accessorKey: "abolished",
    footer: () => {
      if (isAdmin.value) {
        return h(UFieldGroup, {}, () => [
          h(UButton, { icon: ui.icons.reload, onClick: () => emits("refresh") }),
          h(LazyTournamentCreate, { hydrateOnIdle: true })
        ])
      }
    }
  }
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

  let newSort: string | null = field

  if (currentSort) {
    const [currentField, currentDirection] = (currentSort as string).split("-")

    if (currentField === field) {
      if (currentDirection === "asc") {
        newSort += "-desc"
      } else {
        newSort = null
      }
    } else {
      newSort += "-asc"
    }
  } else {
    newSort += "-asc"
  }

  updateRouteQuery("sort", newSort)
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
      tbody: '[&>tr]:cursor-pointer [&>tr]:even:bg-elevated/25'
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
        <u-popover>
          <u-button
            variant="ghost"
            color="neutral"
            :icon="ICONS.calendar"
            :label="<string>route.query.established || 'Established'"
            class="ring-primary"
            :class="route.query.established ? '' : 'text-muted'"
          />

          <template #content>
            <u-calendar
              :model-value="selectedEstablishedDate"
              @update:model-value="updateRouteQuery('established', $event ? ($event as DateValue).year : undefined)"
              type="year"
            />
          </template>
        </u-popover>
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
        <u-popover>
          <u-button
            variant="ghost"
            color="neutral"
            :icon="ICONS.calendar"
            :label="<string>route.query.abolished || 'Abolished'"
            class="ring-primary"
            :class="route.query.abolished ? '' : 'text-muted'"
          />

          <template #content>
            <u-calendar
              :model-value="selectedAbolishedDate"
              @update:model-value="updateRouteQuery('abolished', $event ? ($event as DateValue).year : undefined)"
              type="year"
            />
          </template>
        </u-popover>

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
