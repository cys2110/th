<script setup lang="ts">
definePageMeta({ name: "titles-and-finals" })

const {
  params: { id }
} = useRoute("titles-and-finals")
const playerStore = usePlayerStore()
const viewModeStore = useViewModeStore()

const {
  data: events,
  status,
  error
} = await useFetch("/api/player/titles-and-finals", {
  query: { id },
  default: () => []
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

// Card
const selection = ref<string[]>([])
const selectionOptions = ["Titles", "Finals"]

const types = ref<MatchTypeEnumType[]>([])

const levels = ref<LevelEnumType[]>([])

const surfaces = ref<SurfaceEnumType[]>([])

const years = ref<number[]>([])
const yearOptions = computed(() => useSorted(useArrayUnique(events.value.map(e => e.year))).value)

const categories = ref<string[]>([])
const categoryOptions = computed(() => useSorted(useArrayUnique(events.value.map(e => e.category))).value)

const tournaments = ref<OptionType[]>([])
const tournamentOptions = computed(
  () =>
    useSorted(
      useArrayUnique(
        events.value.map(e => ({ value: e.tournament.id, label: e.tournament.name })),
        (a, b) => a.value === b.value
      ),
      (a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase())
    ).value
)

const resetFilters = () => {
  selection.value = []
  types.value = []
  levels.value = []
  surfaces.value = []
  years.value = []
  categories.value = []
  tournaments.value = []
}

const filteredEvents = computed(() =>
  events.value.filter(event => {
    const selectionMatch =
      selection.value.length === 0 || (selection.value.includes("Titles") && event.title) || (selection.value.includes("Finals") && !event.title)
    const typeMatch = types.value.length === 0 || types.value.includes(event.type)
    const levelMatch = levels.value.length === 0 || levels.value.includes(event.level)
    const surfaceMatch = surfaces.value.length === 0 || surfaces.value.includes(event.surface.surface)
    const yearMatch = years.value.length === 0 || years.value.includes(event.year)
    const categoryMatch = categories.value.length === 0 || (event.category && categories.value.includes(event.category))
    const tournamentMatch = tournaments.value.length === 0 || tournaments.value.some(t => t.value === event.tournament.id)

    return selectionMatch && typeMatch && levelMatch && surfaceMatch && yearMatch && categoryMatch && tournamentMatch
  })
)

const tableRef = useTemplateRef("tableRef")
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <template v-if="tableRef?.table">
            <table-client-clear-filters :table="tableRef.table" />

            <table-client-clear-sorting :table="tableRef.table" />

            <table-client-clear-grouping :table="tableRef.table" />
          </template>

          <filters
            v-else
            :reset-filters
          >
            <u-checkbox-group
              v-model="selection"
              legend="Titles / Finals"
              :items="selectionOptions"
            />

            <u-checkbox-group
              v-model="types"
              legend="S/D"
              :items="Object.values(MatchTypeEnum.enum)"
            />

            <u-checkbox-group
              v-model="levels"
              legend="Levels"
              :items="Object.values(LevelEnum.enum)"
            />

            <u-checkbox-group
              v-model="surfaces"
              legend="Surfaces"
              :items="Object.values(SurfaceEnum.enum)"
            />

            <filters-years
              v-model="years"
              :year-options
              multiple
            />

            <filters-categories
              v-model="categories"
              :items="categoryOptions as string[]"
            />

            <filters-tournaments
              v-model="tournaments"
              :items="tournamentOptions"
            />
          </filters>
        </u-page-aside>
      </template>

      <player-wrapper>
        <template #header-links>
          <view-switcher />

          <u-slideover
            class="lg:hidden"
            title="Filters"
          >
            <u-button :icon="ICONS.filter" />

            <template #body>
              <template v-if="tableRef?.table">
                <table-client-clear-filters :table="tableRef.table" />

                <table-client-clear-sorting :table="tableRef.table" />

                <table-client-clear-grouping :table="tableRef.table" />
              </template>

              <filters
                v-else
                :reset-filters
              >
                <u-checkbox-group
                  v-model="selection"
                  legend="Titles / Finals"
                  :items="selectionOptions"
                />

                <u-checkbox-group
                  v-model="types"
                  legend="S/D"
                  :items="Object.values(MatchTypeEnum.enum)"
                />

                <u-checkbox-group
                  v-model="levels"
                  legend="Levels"
                  :items="Object.values(LevelEnum.enum)"
                />

                <u-checkbox-group
                  v-model="surfaces"
                  legend="Surfaces"
                  :items="Object.values(SurfaceEnum.enum)"
                />

                <filters-years
                  v-model="years"
                  :year-options
                  multiple
                />

                <form-input-menu
                  v-model="categories"
                  placeholder="Categories"
                  :items="categories"
                  multiple
                  :icon="ICONS.category"
                />

                <form-input-menu
                  v-model="tournaments"
                  placeholder="Tournaments"
                  :items="tournamentOptions"
                  multiple
                  :icon="ICONS.trophy"
                />
              </filters>
            </template>
          </u-slideover>
        </template>
      </player-wrapper>

      <u-page-body>
        <template v-if="viewModeStore.isCardView">
          <player-titles-and-finals-timeline
            v-if="filteredEvents.length"
            :events="filteredEvents"
          />

          <empty
            v-else
            :icon="ICONS.trophyOff"
            :message="`${playerStore.fullName} has not ${selection.length === 1 && selection.includes('Titles') ? 'won' : 'played'} any ${
              selection.length === 1 && selection.includes('Titles') ? 'titles' : 'finals'
            }${
              selection.length || types.length || levels.length || surfaces.length || years.length || categories.length || tournaments.length ?
                ' for the selected filters'
              : ''
            }.`"
          />
        </template>

        <player-titles-and-finals-table
          v-else
          ref="tableRef"
          :events
          :status
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
