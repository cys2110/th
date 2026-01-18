<script setup lang="ts">
definePageMeta({ name: "activity" })

const {
  params: { id }
} = useRoute("activity")

const viewModeStore = useViewModeStore()
const playerStore = usePlayerStore()

const years = useRouteQuery("year", null, {
  transform: toNumberArray
})
const tournaments = useRouteQuery("tournaments", null, {
  transform: {
    get: (val: string | null): OptionType[] => parseOption(val),
    set: (val: OptionType[]): string | null => serialiseOption(val)
  }
})
const categories = useRouteQuery("categories", null, { transform: val => toArray(val) })
const levels = useRouteQuery("levels", null, { transform: val => toArray(val) })
const matchType = useRouteQuery<"Singles" | "Doubles">("matchType", "Singles")
const surfaces = useRouteQuery("surfaces", null, { transform: val => toArray(val) })

onMounted(() => {
  if (years.value.length === 0) {
    set(years, [playerStore.activeYears.slice(-1)[0] || new Date().getFullYear()])
  }
})

const resetFilters = () => {
  set(years, [playerStore.activeYears.slice(-1)[0] || new Date().getFullYear()])
  set(tournaments, null)
  set(categories, null)
  set(levels, null)
  set(matchType, "Singles")
  set(surfaces, null)
}

// Get unique options
const { data } = await useFetch("/api/player/activity/options", {
  query: { id },
  default: () => ({
    tournaments: [] as OptionType[],
    categories: [] as string[],
    levels: [] as string[],
    matchTypes: [] as string[],
    surfaces: [] as string[]
  })
})

watch(
  () => data.value.matchTypes,
  () => {
    if (data.value.matchTypes.length === 1) {
      set(matchType, data.value.matchTypes[0])
    }
  },
  { immediate: true }
)

const {
  data: activityData,
  status,
  error
} = await useFetch("/api/player/activity", {
  method: "POST",
  body: {
    id,
    years,
    tournaments,
    categories,
    levels,
    matchType,
    surfaces
  },
  default: () => ({
    stats: { singles_wins: 0, singles_losses: 0, doubles_wins: 0, doubles_losses: 0, singles_titles: 0, doubles_titles: 0 },
    events: []
  })
})

watch(
  error,
  () => {
    if (error.value) {
      if (error.value.statusMessage === "Validation errors") {
        console.error(error.value.statusMessage, error.value.data?.data.validationErrors)
      } else {
        console.error(error.value)
      }
    }
  },
  { immediate: true }
)

const consolidatedEvents = computed(() => {
  const uniqueEvents = useArrayUnique(activityData.value.events.map(e => e.id)).value

  return uniqueEvents.map(eventId => {
    const matchingEvents = activityData.value.events.filter(e => e.id === eventId)

    return {
      ...matchingEvents[0],
      match: matchingEvents.flatMap(e => e.match)
    } as ConsolidatedActivityType
  })
})

// Table options
const tableRef = useTemplateRef("tableRef")
const resetSorting = () => tableRef.value?.table?.tableApi.resetSorting()
const resetGrouping = () => tableRef.value?.table?.tableApi.setGrouping([])

watch(
  () => matchType.value,
  () => {
    if (tableRef.value?.table && matchType.value === "Singles" && tableRef.value?.table?.tableApi.getState().grouping.includes("partner_last_name")) {
      resetGrouping()
    }
  },
  { immediate: true }
)
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <u-button
            label="Reset Filters"
            :icon="ICONS.filterOff"
            @click="resetFilters"
            block
          />

          <u-button
            v-if="!viewModeStore.isCardView"
            label="Reset Sorting"
            :icon="ICONS.sort"
            @click="resetSorting"
            block
          />

          <u-button
            v-if="!viewModeStore.isCardView"
            label="Reset Grouping"
            :icon="ICONS.groupOff"
            @click="resetGrouping"
            block
          />

          <u-separator />

          <u-form-field label="Filter by">
            <div class="*:my-2">
              <filters-years
                v-if="playerStore.activeYears.length > 1"
                v-model="years"
                :year-options="playerStore.activeYears"
                multiple
              />

              <filters-levels
                v-if="data.levels.length > 1"
                v-model="levels as LevelEnumType[]"
                :items="data.levels as LevelEnumType[]"
              />

              <filters-tournaments
                v-if="data.tournaments.length > 1"
                v-model="tournaments"
                :items="data.tournaments"
              />

              <filters-categories
                v-if="data.categories.length > 1"
                v-model="categories as string[]"
                :items="data.categories"
              />

              <filters-match-type
                v-if="data.matchTypes.length > 1"
                v-model="matchType as MatchTypeEnumType"
              />

              <filters-surfaces
                v-if="data.surfaces.length > 1"
                v-model="surfaces as SurfaceEnumType[]"
                :items="data.surfaces as SurfaceEnumType[]"
              />
            </div>
          </u-form-field>
        </u-page-aside>
      </template>

      <player-wrapper>
        <template #header-links>
          <view-switcher />
        </template>
      </player-wrapper>

      <u-page-body>
        <u-container class="my-5 flex items-center justify-stretch gap-5">
          <u-container
            v-for="matchType in ['Singles', 'Doubles']"
            :key="matchType"
            class="ring-2 p-5 rounded-lg text-center"
            :class="matchType === 'Singles' ? 'ring-Singles' : 'ring-Doubles'"
          >
            <div class="font-semibold text-muted">{{ matchType }}</div>
            <div class="text-sm">
              <div>
                {{ activityData.stats[`${matchType.toLowerCase()}_wins` as keyof typeof activityData.stats] }}-{{
                  activityData.stats[`${matchType.toLowerCase()}_losses` as keyof typeof activityData.stats]
                }}
              </div>
              <div>Titles {{ activityData.stats[`${matchType.toLowerCase()}_titles` as keyof typeof activityData.stats] }}</div>
            </div>
          </u-container>
        </u-container>

        <template v-if="viewModeStore.isCardView">
          <u-page-list
            v-if="activityData.events.length || status === 'pending'"
            class="*:my-3 scrollbar p-5"
          >
            <player-activity-card
              v-if="consolidatedEvents.length"
              v-for="event in consolidatedEvents"
              :key="event.id"
              :event
            />

            <player-activity-loading
              v-else
              v-for="_ in 6"
              :key="_"
            />
          </u-page-list>

          <empty
            v-else
            :message="`${playerStore.fullName} has not played any matches for the selected filters.`"
            :icon="ICONS.calendarOff"
          />
        </template>

        <player-activity-table
          v-else
          ref="tableRef"
          :events="activityData.events"
          :status
          v-model="matchType"
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
