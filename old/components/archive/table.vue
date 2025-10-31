<script setup lang="ts">
import { type TableColumn, type TableRow } from "@nuxt/ui"
import type { RouteLocationRaw } from "vue-router"

const { status, count, events } = defineProps<{
  events: EventInterface[]
  resetFilters: () => void
  count: number
  status: APIStatusType
}>()
const skip = defineModel<number>("skip")
const filters = defineModel<EventFiltersType>("filters")

const toast = useToast()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const lgAndUp = breakpoints.greaterOrEqual("lg")
const table = useTemplateRef<any>("table")

onMounted(() => {
  useInfiniteScroll(
    table.value?.$el,
    () => {
      set(skip, get(skip)! + 40)
    },
    {
      distance: 50,
      canLoadMore: () => {
        return get(status) !== "pending" && count > events.length
      }
    }
  )
})

const columns: TableColumn<EventInterface>[] = [
  { id: "tournament", accessorKey: "tournament.name" },
  { accessorKey: "year" },
  { accessorKey: "levels" },
  { accessorKey: "tours" },
  { accessorKey: "categories" },
  { accessorKey: "dates" },
  { id: "environment", accessorKey: "surface.environment" },
  { id: "surface", accessorKey: "surface.surface" },
  { accessorKey: "venues" },
  { accessorKey: "countries" },
  { accessorKey: "supervisors" },
  { accessorKey: "umpires" }
]

const columnPinning = ref({
  left: ["tournament"],
  right: []
})

const handleSelect = (row: TableRow<EventInterface>) => {
  toast.clear()
  toast.add({
    title: row.original.tournament.name,
    description: row.original.year.toString(),
    duration: Infinity,
    progress: false,
    actions: [
      {
        icon: ICONS.tournament,
        label: "Tournament",
        onClick: async () => {
          toast.clear()
          await navigateTo({
            name: "tournament",
            params: { id: row.original.tournament.id, name: kebabCase(row.original.tournament.name) }
          } as RouteLocationRaw)
        }
      },
      ...EVENT_PAGES.map(page => ({
        icon: page.icon,
        label: page.label,
        ui: { leadingIcon: page.icon === ICONS.draw ? "rotate-270" : undefined },
        onClick: () => {
          toast.clear()
          navigateTo({
            name: page.name,
            params: {
              id: row.original.tournament.id,
              name: kebabCase(row.original.tournament.name),
              year: row.original.year,
              eid: row.original.id
            }
          } as RouteLocationRaw)
        }
      }))
    ]
  })
}

onBeforeUnmount(() => toast.clear())
onBeforeRouteLeave(() => toast.clear())
</script>

<template>
  <u-dashboard-panel>
    <template #header>
      <u-dashboard-navbar>
        <template #title> <page-title /> </template>
      </u-dashboard-navbar>

      <u-dashboard-toolbar>
        <dev-only>
          <person-create />
          <venue-create />
        </dev-only>
        <u-button
          label="Reset Filters"
          :icon="ICONS.noFilter"
          @click="resetFilters"
          block
        />

        <table-visibility
          v-if="table"
          :table="table!"
        />
      </u-dashboard-toolbar>
    </template>

    <template #body>
      <u-table
        ref="table"
        :data="events"
        :columns
        :loading="status === 'pending'"
        sticky
        v-model:column-pinning="columnPinning"
        @select="handleSelect"
        render-fallback-value="Various"
        :ui="{ tbody: '[&>tr]:cursor-pointer' }"
      >
        <template #loading>
          <loading-table-message />
        </template>
        <template #empty>
          <empty-table
            message="No events found"
            :icon="ICONS.noEvent"
          />
        </template>

        <template #tournament-header>
          <form-select-search
            v-if="filters"
            v-model="filters.tournaments"
            placeholder="Tournament"
            type="tournaments"
            :icon="ICONS.tournament"
          />
        </template>

        <template #year-header>
          <form-select-menu
            v-if="filters"
            v-model="filters.year"
            :items="ALL_YEARS"
            placeholder="Year"
            :icon="ICONS.event"
          />
        </template>

        <template #levels-header>
          <form-select-menu
            v-if="filters"
            v-model="filters.levels"
            :items="['Tour', 'Challenger', 'ITF']"
            placeholder="Level"
            multiple
            :icon="ICONS.level"
          />
        </template>

        <template #levels-cell="{ row }">
          <div class="flex justify-center items-center gap-1">
            <coloured-badge
              v-for="level in row.original.levels"
              :key="level"
              :label="level"
            />
          </div>
        </template>

        <template #tours-header>
          <form-select-menu
            v-if="filters"
            v-model="filters.tours"
            :items="Object.entries(TourEnum).map(tour => ({ value: tour[0], label: tour[1] }))"
            placeholder="Tour"
            :icon="ICONS.tour"
            multiple
          />
        </template>

        <template #tours-cell="{ row }">
          <div class="flex justify-center items-center gap-1">
            <u-badge
              v-for="tour in row.original.tours"
              :key="tour"
              :label="TourEnum[tour]"
              :color="tour"
            />
          </div>
        </template>

        <template #categories-header>
          <form-select-menu
            v-if="filters"
            v-model="filters.categories"
            :items="useArrayUnique(ALL_CATEGORIES).value"
            placeholder="Category"
            :icon="ICONS.categories"
          />
        </template>

        <template #categories-cell="{ row }">
          <template
            v-for="(category, index) in row.original.categories"
            :key="index"
          >
            <div
              v-if="category"
              :class="`text-${tourColourMapping[index]}`"
            >
              {{ category }}
            </div>
          </template>
        </template>

        <template #dates-header>
          <form-dates-picker
            v-if="filters"
            v-model="filters.dateRange"
            placeholder="Dates"
          />
        </template>

        <template #dates-cell="{ row }">
          <template
            v-for="(date, index) in row.original.dates"
            :key="index"
          >
            <div
              v-if="date[0] && date[1]"
              :class="`text-${tourColourMapping[index]}`"
            >
              {{
                lgAndUp
                  ? dateTimeFormat.formatRange(new Date(date[0]), new Date(date[1]))
                  : shortDateFormat.formatRange(new Date(date[0]), new Date(date[1]))
              }}
            </div>
          </template>
        </template>

        <template #environment-header>
          <form-select-menu
            v-if="filters"
            v-model="filters.environment"
            :items="['Indoor', 'Outdoor']"
            placeholder="Environment"
          />
        </template>

        <template #surface-header>
          <form-select-menu
            v-if="filters"
            v-model="filters.surfaces"
            :items="['Clay', 'Grass', 'Hard', 'Carpet']"
            :icon="ICONS.court"
            placeholder="Surface"
            multiple
          />
        </template>

        <template #venues-header>
          <form-select-search
            v-if="filters"
            v-model="filters.venues"
            type="venues"
            placeholder="Venue"
            :icon="ICONS.venue"
          />
        </template>

        <template #venues-cell="{ row }">
          <div
            v-for="venue in row.original.venues"
            :key="venue.id"
          >
            {{ venue.name ? `${venue.name}, ${venue.city}` : venue.city }}
          </div>
        </template>

        <template #countries-header>
          <form-select-search
            v-if="filters"
            v-model="filters.countries"
            type="countries"
            placeholder="Country"
            :icon="ICONS.countries"
          />
        </template>

        <template #countries-cell="{ row }">
          <country-link
            v-for="country in row.original.countries"
            :key="country.id"
            :country
            icon-only
          />
        </template>

        <template #supervisors-header>
          <form-select-search
            v-if="filters"
            v-model="filters.supervisors"
            type="supervisors"
            placeholder="Supervisor"
            :icon="ICONS.supervisor"
          />
        </template>

        <template #supervisors-cell="{ row }">
          <div
            v-for="supervisor in row.original.supervisors"
            :key="supervisor.id"
          >
            {{ supervisor.id }}
          </div>
        </template>

        <template #umpires-header>
          <form-select-search
            v-if="filters"
            v-model="filters.umpires"
            type="umpires"
            placeholder="Umpire"
            :icon="ICONS.umpire"
          />
        </template>

        <template #umpires-cell="{ row }">
          <div
            v-for="umpire in row.original.umpires"
            :key="umpire.id"
          >
            {{ umpire.id }}
          </div>
        </template>
      </u-table>
    </template>
  </u-dashboard-panel>
</template>
