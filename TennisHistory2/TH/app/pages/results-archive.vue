<script setup lang="ts">
import { formatDate, ICONS, LEVELS, TOUR_OPTIONS } from "#imports"
import { CalendarDate, getLocalTimeZone, parseDate, today } from "@internationalized/date"

definePageMeta({ middleware: ["results-archive"] })

useHead({ title: "Results Archive" })

const route = useRoute("results-archive")
const router = useRouter()
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const viewModeStore = useViewModeStore()
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
      .select(
        "*, tournament:tournaments(id, name, tours), events(*, ...event_surface_mapping(surfaces(*)), ...event_venue_mapping(venues(*, country:countries(*))), ...event_supervisor_mapping(supervisors:people(*)))"
      )
      .eq("year", Number(route.query.year))

    if (error || !data) {
      console.error("Error fetching editions:", error)
      return []
    }

    return (data as Array<ArchiveInterface>).sort((a, b) => getSortDate(a).localeCompare(getSortDate(b)))
  },
  { default: () => [], watch: [() => route.query.year] }
)

const selectedYear = computed(() => {
  if (route.query.year) {
    return new CalendarDate(Number(route.query.year), 1, 1)
  }
})

const selectedDates = computed(() => ({
  start: route.query.start_date ? parseDate(route.query.start_date as string) : undefined,
  end: route.query.end_date ? parseDate(route.query.end_date as string) : undefined
}))

const dateRange = computed(() => {
  const allDates = editions.value.map(getEditionDateRange).filter(date => date !== undefined)

  if (!allDates.length) return null

  return {
    min: allDates.reduce((min, dates) => (dates.start.compare(min) < 0 ? dates.start : min), allDates[0]!.start),
    max: allDates.reduce((max, dates) => (dates.end.compare(max) > 0 ? dates.end : max), allDates[0]!.end)
  }
})

const clearDates = () => {
  const query = { ...route.query }

  delete query.start_date
  delete query.end_date

  router.replace({ query })
}

const getEditionDateRange = (edition: ArchiveInterface) => {
  const startDates = (edition.start_date ? [edition.start_date] : edition.events.map(event => event.start_date)).filter((date): date is string =>
    Boolean(date)
  )
  const endDates = (edition.end_date ? [edition.end_date] : edition.events.map(event => event.end_date)).filter((date): date is string =>
    Boolean(date)
  )

  if (!startDates.length || !endDates.length) return

  return {
    start: parseDate(startDates.sort()[0]!),
    end: parseDate(endDates.sort().at(-1)!)
  }
}

const categories = computed(() =>
  useArrayUnique(editions.value.flatMap(e => (e.category ? [e.category] : e.events.map(e => e.category).filter(Boolean)))).value.sort((a, b) =>
    a.localeCompare(b)
  )
)

const surfaces = computed(() =>
  useArrayUnique(editions.value.flatMap(e => e.events.flatMap(event => event.surfaces.map(s => `${s.environment} ${s.surface}`)))).value.sort(
    (a, b) => a.localeCompare(b)
  )
)

const countries = computed(() =>
  useArrayUnique(
    editions.value.flatMap(e => e.events.flatMap(event => event.venues.map(v => v.country))),
    (a, b) => a.id === b.id
  ).value.sort((a, b) => a.name.localeCompare(b.name))
)

const clearSelection = (field: string) => {
  updateRouteQuery(field, null)
}

const filteredEditions = computed(() =>
  editions.value.filter(e => {
    const isLevelMatch = !route.query.level || e.events.some(e => e.level === route.query.level)

    const isTourMatch = !route.query.tour || e.tours.includes(route.query.tour as TourType) || e.events.some(e => e.tour === route.query.tour)

    const isCategoryMatch = !route.query.category || e.category === route.query.category || e.events.some(e => e.category === route.query.category)

    const isSurfaceMatch = !route.query.surface || e.events.some(e => e.surfaces.some(s => route.query.surface === `${s.environment} ${s.surface}`))

    const isVenueMatch = !route.query.country || e.events.some(e => e.venues.some(v => v.country.id === route.query.country))

    const startDate =
      e.start_date ??
      e.events
        .map(event => event.start_date)
        .filter((date): date is string => Boolean(date))
        .sort()[0]
    const endDate =
      e.end_date ??
      e.events
        .map(event => event.end_date)
        .filter((date): date is string => Boolean(date))
        .sort()
        .at(-1)
    const filterStart = route.query.start_date as string | undefined
    const filterEnd = route.query.end_date as string | undefined
    let isDateMatch = !filterStart && !filterEnd

    if (startDate && endDate) {
      if (filterStart && filterEnd) {
        isDateMatch = endDate >= filterStart && startDate <= filterEnd
      } else if (filterStart) {
        isDateMatch = endDate >= filterStart
      } else if (filterEnd) {
        isDateMatch = startDate <= filterEnd
      }
    }

    return isLevelMatch && isTourMatch && isCategoryMatch && isSurfaceMatch && isVenueMatch && isDateMatch
  })
)
</script>

<template>
  <u-container>
    <u-page>
      <u-page-header
        title="Results Archive"
        :ui="{ root: 'pb-4', description: 'flex justify-end gap-4' }"
      >
        <template #description>
          <u-popover :ui="{ content: 'p-1' }">
            <u-button
              color="neutral"
              variant="outline"
              size="sm"
              :icon="ICONS.years"
              :label="<string>route.query.year"
              class="ring-primary font-normal"
            />

            <template #content>
              <u-calendar
                type="year"
                :model-value="selectedYear"
                @update:model-value="
                  date => {
                    if (date) {
                      const stringDate = date.toString()
                      const [year, month, day] = stringDate.split('-')

                      updateRouteQuery('year', year)
                    }
                  }
                "
                :min-value="parseDate('1968-01-01')"
                :max-value="today(getLocalTimeZone())"
              />
            </template>
          </u-popover>

          <u-popover :ui="{ content: 'p-1' }">
            <u-button
              color="neutral"
              variant="outline"
              size="sm"
              :icon="ICONS.calendar"
              :label="<string>route.query.start_date ? formatDate(route.query.start_date as string, route.query.end_date as string) : 'Dates'"
              class="ring-primary font-normal"
              :class="route.query.start_date || route.query.end_date ? '' : 'text-dimmed'"
            />

            <template #content>
              <u-calendar
                v-if="dateRange"
                :model-value="selectedDates"
                @update:model-value="
                  dates => {
                    if (dates) {
                      router.replace({
                        query: {
                          ...route.query,
                          start_date: dates.start?.toString(),
                          end_date: dates.end?.toString()
                        }
                      })
                    } else {
                      clearDates()
                    }
                  }
                "
                range
                :default-value="{ start: dateRange.min, end: dateRange.max }"
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

          <u-select
            :model-value="<LevelType>route.query.level"
            @update:model-value="updateRouteQuery('level', $event?.toString())"
            highlight
            clear
            :items="[...LEVELS]"
            :icon="ICONS.level"
            placeholder="Level"
          >
            <template #content-bottom>
              <u-button
                block
                label="Clear"
                :icon="ui.icons.error"
                @click="clearSelection('level')"
              />
            </template>
          </u-select>

          <u-select
            :model-value="<TourType>route.query.tour"
            @update:model-value="updateRouteQuery('tour', $event?.toString())"
            highlight
            clear
            :items="[...TOUR_OPTIONS]"
            :icon="ICONS.tour"
            placeholder="Tour"
          >
            <template #content-bottom>
              <u-button
                block
                label="Clear"
                :icon="ui.icons.error"
                @click="clearSelection('tour')"
              />
            </template>
          </u-select>

          <u-select-menu
            :model-value="<string>route.query.category"
            @update:model-value="updateRouteQuery('category', $event?.toString())"
            highlight
            clear
            :items="categories"
            :icon="ICONS.category"
            placeholder="Category"
          />

          <u-select-menu
            :model-value="<string>route.query.surface"
            @update:model-value="updateRouteQuery('surface', $event?.toString())"
            highlight
            clear
            :items="surfaces"
            :icon="ICONS.court"
            placeholder="Surface"
          />

          <u-select-menu
            :model-value="<string>route.query.country"
            @update:model-value="updateRouteQuery('country', $event?.toString())"
            highlight
            clear
            :items="countries"
            placeholder="Country"
            value-key="id"
            label-key="name"
          >
            <template #leading="{ modelValue }">
              <u-icon :name="modelValue ? countries.find(c => c.id === modelValue)?.icon : ICONS.globe" />
            </template>
          </u-select-menu>
        </template>
      </u-page-header>

      <u-page-body>
        <archive-table
          v-if="viewModeStore.isTableView"
          :editions="filteredEditions"
          :pending
          @refresh="refresh"
        />

        <archive-grid
          v-else
          :editions="filteredEditions"
          :pending
          @refresh="refresh"
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
