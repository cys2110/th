<script setup lang="ts">
import { ICONS, TOUR_OPTIONS } from "#imports"
import { CalendarDate, type DateValue } from "@internationalized/date"

useHead({ title: "Tournaments" })

const route = useRoute("tournaments")
const supabase = useSupabaseClient()

const viewModeStore = useViewModeStore()
const updateRouteQuery = useRouteQueryUpdater()

const count = ref(0)
const tournaments = ref<Array<TournamentInterface>>([])
const canLoadMore = ref(false)
const offset = ref(0)

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

const { pending, execute, refresh } = await useAsyncData(
  () => `tournaments-${JSON.stringify(route.query)}`,
  async () => {
    const query = supabase
      .from("tournaments")
      .select("*", { count: "exact" })
      .range(offset.value, offset.value + 29)

    if (route.query.tour) query.overlaps("tours", route.query.tour as Array<TourType>)

    if (route.query.established) query.gte("established", Number(route.query.established))

    if (route.query.abolished) query.lte("abolished", Number(route.query.abolished))

    if (route.query.sort) {
      const [field, direction] = (route.query.sort as string).split("-")

      query.order(field as string, { ascending: direction === "asc" })
    } else {
      query.order("name", { ascending: true })
    }

    query.order("id", { ascending: true }) // Add id sorting for consistent ordering

    const { data, count: countData, error } = await query

    if (error || !data) {
      console.error("Error fetching tournaments:", error)
      return []
    }

    set(canLoadMore, data.length + tournaments.value.length < (countData || 0))
    set(count, countData || 0)

    set(tournaments, tournaments.value.concat(data))

    return data
  },
  {
    immediate: false,
    lazy: true,
    default: () => [],
    watch: [offset] // triggers when offset changes
  }
)

execute()

// Reset search results when filters change
watchDeep([() => route.query.tour, () => route.query.established, () => route.query.abolished], () => {
  set(tournaments, [])
  set(offset, 0)
  refresh()
})

const loadMore = () => {
  if (pending.value) return

  offset.value += 30
}
</script>

<template>
  <u-container>
    <u-page>
      <u-page-header
        title="Tournaments"
        :ui="{ root: 'pb-4', description: 'flex justify-end gap-4' }"
      >
        <template
          #description
          v-if="!viewModeStore.isTableView"
        >
          <u-select
            :model-value="<Array<TourType>>route.query.tour"
            @update:model-value="updateRouteQuery('tour', $event)"
            :items="[...TOUR_OPTIONS]"
            placeholder="Filter by Tour"
            multiple
            :icon="ICONS.tour"
            highlight
          />

          <u-popover>
            <u-button
              variant="outline"
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

          <u-popover>
            <u-button
              variant="outline"
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
        </template>
      </u-page-header>

      <u-page-body>
        <tournament-table
          v-if="viewModeStore.isTableView"
          :tournaments
          :pending
          :can-load-more
          :count
          @load-more="loadMore"
          @refresh="refresh"
        />

        <tournament-grid
          v-else
          :tournaments
          :pending
          :can-load-more
          @load-more="loadMore"
          @refresh="refresh"
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
