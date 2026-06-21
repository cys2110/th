<script setup lang="ts">
import { formatDate, ICONS, kebabCase, MONTHS, OPEN_ERA_YEARS } from "#imports"
import type { TableColumn, TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues } from "@tanstack/vue-table"
import { CalendarDate, type DateValue, parseDate } from "@internationalized/date"

definePageMeta({ middleware: ["year-query"] })

useHead({ title: "Results Archive" })

const route = useRoute("results-archive")
const router = useRouter()
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const updateRouteQuery = useRouteQueryUpdater()

const getSortDate = (item: ArchiveInterface) =>
  item.start_date ??
  item.events
    ?.map(e => e.start_date)
    .filter((date): date is string => Boolean(date))
    .sort()[0] ??
  ""

const {
  data: editions,
  pending,
  refresh
} = await useAsyncData<Array<ArchiveInterface>>(
  () => `results-archive-${route.query.year}`,
  async () => {
    const { data, error } = await supabase
      .from("editions")
      .select("*, tournaments(id, name, tours), events(*, event_surface_mapping(surfaces(*)), event_venue_mapping(venues(*, countries(*))))")
      .eq("year", Number(route.query.year))

    if (error || !data) {
      console.error("Error fetching editions:", error)
      return []
    }

    return data
      .map(item => {
        const edition: Partial<ArchiveInterface> = {
          id: item.id,
          sponsor_name: item.sponsor_name,
          year: item.year,
          category: item.category,
          start_date: item.start_date,
          end_date: item.end_date,
          tournament: item.tournaments
        }

        if (item.events.length === 1) {
          edition.level = item.events[0]!.level
          edition.tour = item.tours[0]
          edition.category = item.events[0]!.category
          edition.surfaces = item.events[0]!.event_surface_mapping.map(s => s.surfaces)
          edition.venues = item.events[0]!.event_venue_mapping.map(v => ({
            id: v.venues?.id,
            name: v.venues?.name,
            city: v.venues?.city,
            country: v.venues?.countries
          }))
          edition.events = []
        } else {
          edition.events = item.events.map(subItem => {
            const event: Partial<ArchiveInterface> = {
              id: item.id,
              year: item.year,
              sponsor_name: subItem.sponsor_name,
              tour: subItem.tour,
              category: subItem.category,
              start_date: subItem.start_date,
              end_date: subItem.end_date
            }

            // If all item.events have the same level, then set level at edition otherwise set level at event
            const levels = new Set(item.events.map(e => e.level))
            if (levels.size === 1) {
              edition.level = subItem.level
            } else {
              event.level = subItem.level
            }

            // If all item.events have the same surfaces, then set surfaces at edition otherwise set surfaces at event
            const subItemSurfaces = subItem.event_surface_mapping.map(s => s.surfaces.id)
            const allEventSurfaces = useArrayUnique(item.events.flatMap(e => e.event_surface_mapping.map(s => s.surfaces.id))).value
            if (isEqual(subItemSurfaces, allEventSurfaces)) {
              edition.surfaces = subItem.event_surface_mapping.map(s => s.surfaces)
            } else {
              event.surfaces = subItem.event_surface_mapping.map(s => s.surfaces)
            }

            // If all item.events have the same venues, then set venues at edition otherwise set venues at event
            const subItemVenues = subItem.event_venue_mapping.map(v => v.venues?.id)
            const allEventVenues = useArrayUnique(item.events.flatMap(e => e.event_venue_mapping.map(v => v.venues?.id))).value
            if (isEqual(subItemVenues, allEventVenues)) {
              edition.venues = subItem.event_venue_mapping.map(v => ({
                id: v.venues?.id,
                name: v.venues?.name,
                city: v.venues?.city,
                country: v.venues?.countries
              }))
            } else {
              event.venues = subItem.event_venue_mapping.map(v => ({
                id: v.venues?.id,
                name: v.venues?.name,
                city: v.venues?.city,
                country: v.venues?.countries
              }))
            }

            return event as ArchiveInterface
          })
        }

        return edition as ArchiveInterface
      })
      .sort((a, b) => getSortDate(a).localeCompare(getSortDate(b)))
  },
  { default: () => [], watch: [() => route.query.year] }
)

const filteredEditions = computed(() =>
  editions.value.filter(e => {
    let isStartMatch = true
    let isEndMatch = true

    if (route.query.start_date) {
      if (e.start_date) {
        isStartMatch = route.query.start_date <= e.start_date
      } else if (e.events?.length && e.events.some(event => event.start_date && route.query.start_date! <= event.start_date)) {
        isStartMatch = true
      } else {
        isStartMatch = false
      }
    }

    if (route.query.end_date) {
      if (e.end_date) {
        isEndMatch = route.query.end_date <= e.end_date
      } else if (e.events?.length && e.events.some(event => event.end_date && route.query.start_date! <= event.end_date)) {
        isEndMatch = true
      } else {
        isEndMatch = false
      }
    }

    return isStartMatch && isEndMatch
  })
)

const selectedDate = computed(() => ({
  start: route.query.start_date ? parseDate(route.query.start_date as string) : undefined,
  end: route.query.end_date ? parseDate(route.query.end_date as string) : undefined
}))

const dateRange = computed(() => ({
  min: new CalendarDate(Number(route.query.year), 1, 1),
  max: new CalendarDate(Number(route.query.year), 12, 31)
}))

const clearDates = () => {
  const query = { ...route.query }
  delete query.start_date
  delete query.end_date

  router.push({ query })
}

const columns: Array<TableColumn<ArchiveInterface>> = [
  {
    accessorKey: "tournament.name",
    footer: ({ table }) => {
      const rowCount = table.getFilteredRowModel().rows.length

      return `${rowCount.toLocaleString()} edition${rowCount === 1 ? "" : "s"}`
    }
  },
  { accessorKey: "tour" },
  { accessorKey: "level" },
  { accessorKey: "category" },
  { id: "dates" },
  { id: "surface", accessorFn: row => (row.surfaces?.length ? row.surfaces.map(s => `${s.environment} ${s.surface}`) : []) },
  { id: "country", accessorFn: row => (row.venues ? useArrayUnique(row.venues.map(v => v.country.name)).value : []) }
]

const handleSelectRow = (_e: Event, row: TableRow<ArchiveInterface>) => {
  const { tournament, id, year } = row.original

  router.push({ name: "edition", params: { id: tournament?.id || 0, name: kebabCase(tournament?.name), year, edition_id: id } })
}

const getUniqueLocations = (venues: Array<VenueInterface>) => {
  const uniqueVenues = useArrayUnique(venues, (a, b) => a.city === b.city).value

  return uniqueVenues.map(v => ({
    city: v.city,
    country: v.country
  }))
}
</script>

<template>
  <u-container>
    <u-page>
      <u-page-header
        title="Results Archive"
        :ui="{ root: 'pb-4', description: 'flex justify-end gap-4' }"
      >
        <template #description>
          <u-select-menu
            :model-value="<string>route.query.year ? Number(route.query.year) : undefined"
            @update:model-value="updateRouteQuery('year', $event)"
            :icon="ICONS.calendar"
            :items="OPEN_ERA_YEARS"
            highlight
          />
        </template>
      </u-page-header>

      <u-page-body>
        <client-only>
          <u-table
            :data="filteredEditions"
            :columns
            sticky
            :loading="pending"
            @select="handleSelectRow"
            :get-sub-rows="row => row.events"
            :faceted-options="{
              getFacetedRowModel: getFacetedRowModel(),
              getFacetedUniqueValues: getFacetedUniqueValues()
            }"
            :column-filters-options="{ filterFromLeafRows: true }"
            :ui="{ tr: 'data-[selectable=true]:cursor-pointer', td: 'empty:p-0' }"
          >
            <template #loading>
              <loading-icon />
            </template>

            <template #empty>
              <empty
                :icon="ICONS.calendarOff"
                :title="`There were no tournaments played in ${route.query.year}`"
                @refresh="refresh"
                class="mx-2"
              />
            </template>

            <template #tournament_name-header="{ column }">
              <table-header
                filter
                sort
                :column
                label="Tournament"
                :icon="ICONS.trophy"
              />
            </template>

            <template #tournament_name-cell="{ row }">
              <table-row-toggle
                v-if="row.original.events?.length"
                :row
              >
                <div class="text-left">
                  <div v-if="row.original.tournament">
                    <u-link
                      :to="{ name: 'tournament', params: { id: row.original.tournament.id, name: kebabCase(row.original.tournament.name) } }"
                      class="hover-link primary-link font-semibold"
                    >
                      {{ row.original.tournament.name }}
                    </u-link>
                  </div>
                  <div v-if="row.original.sponsor_name">{{ row.original.sponsor_name }}</div>
                </div>
              </table-row-toggle>

              <div
                v-else
                class="text-left ml-9"
              >
                <div v-if="row.original.tournament">
                  <u-link
                    :to="{ name: 'tournament', params: { id: row.original.tournament.id, name: kebabCase(row.original.tournament.name) } }"
                    class="hover-link primary-link font-semibold"
                  >
                    {{ row.original.tournament.name }}
                  </u-link>
                </div>
                <div v-if="row.original.sponsor_name">{{ row.original.sponsor_name }}</div>
              </div>
            </template>

            <template #tour-header="{ column }">
              <table-header
                filter
                :column
                label="Tour"
                :icon="ICONS.tour"
              />
            </template>

            <template #tour-cell="{ row }">
              <u-badge
                v-if="row.original.tour"
                :label="row.original.tour"
                :color="row.original.tour"
              />
            </template>

            <template #level-header="{ column }">
              <table-header
                filter
                :column
                label="Level"
                :icon="ICONS.level"
              />
            </template>

            <template #level-cell="{ row }">
              <u-badge
                v-if="row.original.level"
                :label="row.original.level"
                :color="row.original.level"
              />
            </template>

            <template #category-header="{ column }">
              <table-header
                filter
                :column
                label="Category"
                :icon="ICONS.category"
              />
            </template>

            <template #dates-header>
              <u-popover :ui="{ content: 'p-1' }">
                <u-button
                  color="neutral"
                  variant="ghost"
                  :icon="ICONS.calendar"
                  :label="<string>route.query.start_date ? formatDate(route.query.start_date as string, route.query.end_date as string) : 'Dates'"
                  :class="route.query.month ? '' : 'text-dimmed'"
                />

                <template #content>
                  <u-calendar
                    :model-value="selectedDate"
                    @update:model-value="
                      dates => {
                        if (dates) {
                          if (dates.start) {
                            updateRouteQuery('start_date', dates.start.toString())
                          }
                          if (dates.end) {
                            updateRouteQuery('end_date', dates.end.toString())
                          }
                        } else {
                          updateRouteQuery('start_date', undefined)
                          updateRouteQuery('end_date', undefined)
                        }
                      }
                    "
                    range
                    :min-value="dateRange.min"
                    :max-value="dateRange.max"
                  />

                  <u-button
                    label="Clear"
                    :icon="ui.icons.error"
                    block
                    @click="clearDates"
                  />
                </template>
              </u-popover>
            </template>

            <template #dates-cell="{ row }">
              <span v-if="row.original.start_date">{{ formatDate(row.original.start_date, row.original.end_date) }}</span>
            </template>

            <template #surface-header="{ column }">
              <table-header
                filter
                :column
                label="Surface"
                :icon="ICONS.court"
              />
            </template>

            <template #surface-cell="{ cell }">
              <div
                v-for="surface in cell.getValue<string[]>()"
                :key="surface"
              >
                {{ surface }}
              </div>
            </template>

            <template #country-header="{ column }">
              <table-header
                filter
                :column
                label="Location"
                :icon="ICONS.venue"
              />
            </template>

            <template #country-cell="{ row }">
              <div
                v-if="row.original.venues?.length"
                v-for="location in getUniqueLocations(row.original.venues)"
                :key="location.city"
                class="flex justify-center items-center gap-2"
              >
                <span>{{ location.city }}</span>
                <country-link
                  :country="location.country"
                  icon-only
                />
              </div>
            </template>
          </u-table>
        </client-only>
      </u-page-body>
    </u-page>
  </u-container>
</template>
