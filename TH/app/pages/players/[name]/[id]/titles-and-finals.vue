<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues, getGroupedRowModel } from "@tanstack/vue-table"

definePageMeta({ name: "titles-and-finals" })

const {
  params: { id }
} = useRoute("titles-and-finals")
const router = useRouter()
const playerStore = usePlayerStore()
const viewModeStore = useViewModeStore()

const { data: events, status } = await useFetch("/api/player/titles-and-finals", {
  query: { id },
  default: () => []
})

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

const tournaments = ref<number[]>([])
const tournamentOptions = computed(
  () =>
    useSorted(
      useArrayUnique(
        events.value.map(e => e.tournament),
        (a, b) => a.id === b.id
      ),
      (a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())
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
    const tournamentMatch = tournaments.value.length === 0 || tournaments.value.includes(event.tournament.id)

    return selectionMatch && typeMatch && levelMatch && surfaceMatch && yearMatch && categoryMatch && tournamentMatch
  })
)

// Table
const table = useTemplateRef("table")

const handleSelectRow = (_e: Event, row: TableRow<TitlesAndFinalsType>) => {
  const {
    tournament: { id, name },
    id: edId,
    year
  } = row.original
  if (row.getIsGrouped()) {
    row.toggleExpanded()
  } else {
    router.push({
      name: "edition",
      params: {
        id,
        name: kebabCase(name),
        edId,
        year
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
          <template v-if="table">
            <table-client-clear-filters :table="table" />

            <table-client-clear-sorting :table="table" />

            <table-client-clear-grouping :table="table" />
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
        </u-page-aside>
      </template>

      <players-wrapper>
        <template #header-links>
          <view-switcher />

          <u-slideover
            class="lg:hidden"
            title="Filters"
          >
            <u-button :icon="ICONS.filter" />

            <template #body>
              <template v-if="table">
                <table-client-clear-filters :table="table" />

                <table-client-clear-sorting :table="table" />

                <table-client-clear-grouping :table="table" />
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
      </players-wrapper>

      <u-page-body>
        <template v-if="viewModeStore.isCardView">
          <players-titles-and-finals-timeline
            v-if="filteredEvents.length"
            :events="filteredEvents"
          />

          <empty
            v-else
            :icon="ICONS.trophyOff"
            :message="`${playerStore.fullName} has not ${selection.length === 1 && selection.includes('Titles') ? 'won' : 'played'} any ${
              selection.length === 1 && selection.includes('Titles') ? 'titles' : 'finals'
            }${
              selection.length || types.length || levels.length || surfaces.length || years.length || categories.length || tournaments.length
                ? ' for the selected filters'
                : ''
            }.`"
          />
        </template>

        <u-table
          v-else
          ref="table"
          :data="events"
          :columns="titlesAndFinalsColumns"
          :loading="status === 'pending'"
          sticky
          @select="handleSelectRow"
          :faceted-options="{
            getFacetedRowModel: getFacetedRowModel(),
            getFacetedUniqueValues: getFacetedUniqueValues()
          }"
          :grouping-options="{
            getGroupedRowModel: getGroupedRowModel()
          }"
          :meta="{
            class: {
              tr: (row: TableRow<TitlesAndFinalsType>) => row.original.title ? 'bg-emerald-700/20' : ''
            }
          }"
          :ui="{ td: 'empty:p-0' }"
        >
          <template #loading>
            <loading-icon />
          </template>
          <template #empty>
            <empty
              :icon="ICONS.trophyOff"
              :message="`${playerStore.fullName} has not ${table?.tableApi.getColumn('title')?.getFilterValue() === true ? 'won' : 'played'} any ${
                table?.tableApi.getColumn('title')?.getFilterValue() === true ? 'titles' : 'finals'
              }${table?.tableApi.getState().columnFilters.length ? ' for the selected filters' : ''}.`"
            /> </template
        ></u-table>
      </u-page-body>
    </u-page>
  </u-container>
</template>
