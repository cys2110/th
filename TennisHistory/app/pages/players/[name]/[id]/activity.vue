<script setup lang="ts">
import { CalendarDate } from "@internationalized/date"
import type { TableRow } from "@nuxt/ui"

definePageMeta({ name: "activity" })
const {
  params: { id, name }
} = useRoute("activity")
const router = useRouter()

const [defineEmptyTemplate, reuseEmptyTemplate] = createReusableTemplate()

const viewMode = ref(true)
const playerName = useState("playerName")

const { data: playerOverview } = await useFetch("/api/players/overview", {
  query: { id }
})

const year = useRouteQuery("year", playerOverview.value?.years?.slice(-1)[0] || new Date().getFullYear(), { transform: Number })
const tournaments = ref([])
const categories = ref([])
const levels = ref([])
const matchType = ref("Singles")
const dateRange = ref<{ start: CalendarDate | undefined; end: CalendarDate | undefined }>({
  start: undefined,
  end: undefined
})
const surfaces = ref([])

const resetFilters = () => {
  tournaments.value = []
  categories.value = []
  levels.value = []
  matchType.value = "Singles"
  dateRange.value = { start: undefined, end: undefined }
  surfaces.value = []
  year.value = playerOverview.value?.years?.slice(-1)[0] || new Date().getFullYear()
}

const { data, status } = await useFetch("/api/players/activity", {
  method: "POST",
  body: {
    id,
    year,
    tournaments,
    categories,
    levels,
    matchType,
    dateRange,
    surfaces
  },
  default: () => ({
    stats: { singles_wins: 0, singles_losses: 0, doubles_wins: 0, doubles_losses: 0, singles_titles: 0, doubles_titles: 0 },
    events: []
  })
})

const consolidatedEvents = computed(() => {
  const uniqueEvents = useArrayUnique(data.value.events.map(e => e.id)).value

  return uniqueEvents.map(eventId => {
    const matchingEvents = data.value.events.filter(e => e.id === eventId)

    return {
      ...matchingEvents[0],
      match: matchingEvents.flatMap(e => e.match)
    } as ConsolidatedActivityType
  })
})

const columnVisibility = computed(() => {
  if (matchType.value === "Singles") {
    return {
      partner: false
    }
  } else {
    return {
      partner: true
    }
  }
})

const handleSelect = (e: Event, row: TableRow<ActivityType>) => {
  if (row.original.match.stats) {
    router.push({
      name: "match",
      params: {
        id: row.original.tournament.id,
        name: kebabCase(row.original.tournament.name),
        year: row.original.year,
        edId: row.original.id
      },
      query: {
        tour: row.original.tour,
        type: row.original.type,
        draw: row.original.match.draw,
        match_no: row.original.match.match_no
      }
    })
  }
}
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <!--@vue-expect-error-->
          <filters
            :filters="['tournaments', 'levels', 'categories', 'surfaces', 'dateRange', 'matchType']"
            v-model:tournaments="tournaments"
            v-model:levels="levels"
            v-model:categories="categories"
            v-model:surfaces="surfaces"
            v-model:dateRange="dateRange"
            v-model:matchType="matchType"
            :reset-filters
          />

          <form-input-menu
            v-model="year"
            placeholder="Filter by year"
            :items="playerOverview?.years || []"
            :icon="ICONS.event"
          />
        </u-page-aside>
      </template>

      <players-wrapper>
        <template #header-links>
          <view-switcher v-model="viewMode" />

          <!--Filters for smaller screens-->
          <u-slideover
            title="Filters"
            class="ml-auto lg:hidden"
          >
            <u-button :icon="ICONS.filter" />

            <template #body>
              <!--@vue-expect-error-->
              <filters
                :filters="['tournaments', 'levels', 'categories', 'surfaces', 'dateRange', 'matchType']"
                v-model:tournaments="tournaments"
                v-model:levels="levels"
                v-model:categories="categories"
                v-model:surfaces="surfaces"
                v-model:dateRange="dateRange"
                v-model:matchType="matchType"
                :reset-filters
              />

              <form-input-menu
                v-model="year"
                placeholder="Filter by year"
                :items="playerOverview?.years || []"
                :icon="ICONS.event"
              />
            </template>
          </u-slideover>
        </template>
      </players-wrapper>

      <u-page-body>
        <define-empty-template>
          <empty :message="`${playerName} played no ${matchType} matches in this year`" />
        </define-empty-template>
        <u-container class="my-5 flex items-center justify-stretch gap-5">
          <u-container class="ring-2 ring-Singles p-5 rounded-lg text-center">
            <div class="font-semibold text-muted">Singles</div>
            <div class="text-sm">
              <div> {{ data.stats.singles_wins }}-{{ data.stats.singles_losses }} </div>
              <div> Titles: {{ data.stats.singles_titles }} </div>
            </div>
          </u-container>
          <u-container class="ring-2 ring-Doubles p-5 rounded-lg text-center">
            <div class="font-semibold text-muted">Doubles</div>
            <div class="text-sm">
              <div> {{ data.stats.doubles_wins }}-{{ data.stats.doubles_losses }} </div>
              <div> Titles: {{ data.stats.doubles_titles }} </div>
            </div>
          </u-container>
        </u-container>
        <template v-if="viewMode">
          <u-page-list
            v-if="data.events.length || status === 'pending'"
            class="*:my-3"
          >
            <players-activity-card
              v-if="data.events.length"
              v-for="event in consolidatedEvents"
              :key="event.id"
              :event
            />
            <loading-base
              v-else
              v-for="_ in 6"
              :key="_"
            />
          </u-page-list>
          <reuse-empty-template v-else />
        </template>
        <u-table
          v-else
          :data="data.events"
          :columns="activityColumns(id, name)"
          :loading="status === 'pending'"
          sticky
          class="max-h-150"
          v-model:column-visibility="columnVisibility"
          @select="handleSelect"
          :meta="{
              class: {
                  tr: (row: TableRow<ActivityType>) => `${row.original.match.draw === 'Main' ? '' : 'bg-elevated'} ${row.original.match.stats ? 'cursor-pointer' : ''}`
              }
            }"
        >
          <template #loading>
            <loading-icon />
          </template>
          <template #empty>
            <reuse-empty-template />
          </template>
        </u-table>
      </u-page-body>
    </u-page>
  </u-container>
</template>
