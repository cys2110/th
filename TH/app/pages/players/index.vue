<script setup lang="ts">
useHead({ title: "Players" })

const viewModeStore = useViewModeStore()
const tableRef = useTemplateRef("tableRef")

// Pagination
const page = useRouteQuery("page", 1, { transform: Number })
const itemsPerPage = useRouteQuery("itemsPerPage", 30, { transform: Number })
const skip = computed(() => (get(page) - 1) * get(itemsPerPage))

// Filters
const tours = useRouteQuery("tours", null, { transform: toArray })
const players = useRouteQuery("players", null, {
  transform: {
    get: parseOption,
    set: serialiseOption
  }
})
const countries = useRouteQuery("countries", null, {
  transform: {
    get: parseOption,
    set: serialiseOption
  }
})
const coaches = useRouteQuery("coaches", null, {
  transform: {
    get: parseOption,
    set: serialiseOption
  }
})
const min_year = useRouteQuery("min_year", null, { transform: Number })
const max_year = useRouteQuery("max_year", null, { transform: Number })

const resetFilters = () => {
  set(tours, null)
  set(players, null)
  set(countries, null)
  set(coaches, null)
  set(min_year, null)
  set(max_year, null)
}

// Grouping
const grouping = useRouteQuery<string | null>("grouping", null)

const resetGrouping = () => set(grouping, null)

// Sorting
const sortField = useRouteQuery("sorting", null, {
  transform: {
    get: parseSort,
    set: serialiseSort
  }
})

const sortFields = [
  { label: "Name", value: "name" },
  { label: "Country", value: "country" },
  { label: "Year of First Tournament", value: "min_year" },
  { label: "Year of Last Tournament", value: "max_year" }
]

const resetSorting = () => set(sortField, [])

// Reset page on filter/sort change
watchDeep(
  [tours, players, countries, coaches, itemsPerPage, sortField, grouping, min_year, max_year],
  () => {
    set(page, 1)
  },
  { immediate: true }
)

const showResetFilters = computed(() => {
  return (
    get(page) > 1 ||
    get(itemsPerPage) !== 30 ||
    !!tours.value?.length ||
    !!players.value?.length ||
    !!countries.value?.length ||
    !!coaches.value?.length ||
    !!min_year.value ||
    !!max_year.value
  )
})

// API call
const apiRoute = computed(() => {
  if (grouping.value && !viewModeStore.isCardView) {
    return "/api/players/groups"
  }
  return "/api/players"
})

const { data, status, error } = await useFetch<{ count: number; results: PlayersResultsType[] }>(apiRoute, {
  method: "POST",
  body: {
    skip,
    itemsPerPage,
    sortField,
    players,
    tours,
    countries,
    coaches,
    grouping,
    min_year,
    max_year
  },
  default: () => ({ count: 0, results: [] })
})

watch(
  error,
  () => {
    if (error.value) {
      if (error.value.statusMessage === "Validation errors") {
        console.error(error.value.statusMessage, error.value.data?.data)
      } else {
        console.error(error.value)
      }
    }
  },
  { immediate: true }
)

const footerPlaceholder = computed(() => {
  if (viewModeStore.isCardView || !grouping.value) {
    return data.value.count === 1 ? "player" : "players"
  } else if (grouping.value === "country") {
    return data.value.count === 1 ? "country" : "countries"
  } else {
    return data.value.count === 1 ? "year" : "years"
  }
})
</script>

<template>
  <u-container class="min-h-screen flex flex-col">
    <u-page
      :ui="{
        root: 'flex-1',
        center: viewModeStore.isCardView ? 'lg:col-span-6' : 'lg:col-span-8'
      }"
    >
      <template #left>
        <u-page-aside>
          <dev-only>
            <player-create />

            <u-separator />
          </dev-only>

          <template v-if="viewModeStore.isCardView">
            <filters
              :reset-filters
              :show-reset-filters
            >
              <filters-tours
                v-model="tours"
                :tour-options="['ATP', 'WTA']"
              />

              <filters-search
                type="Country"
                placeholder="Countries"
                :icon="ICONS.globe"
                v-model="countries"
              />

              <filters-search
                type="Coach"
                placeholder="Coaches"
                :icon="ICONS.coach"
                v-model="coaches"
              />
            </filters>

            <u-separator />

            <filters-sort-field
              :reset-sorting
              :sort-fields
              v-model="sortField"
            />
          </template>

          <template v-else>
            <table-reset-grouping
              v-if="grouping"
              :reset-grouping
            />
            <table-visibility
              v-if="tableRef?.table"
              :table="tableRef?.table"
            />
          </template>
        </u-page-aside>
      </template>

      <template
        #right
        v-if="viewModeStore.isCardView"
      >
        <u-page-aside>
          <filters-command-palette
            :icon="ICONS.player"
            type="Player"
            v-model="players"
          />
        </u-page-aside>
      </template>

      <u-page-header title="Players">
        <template #links>
          <view-switcher />

          <!--Filters for smaller screens-->
          <u-slideover
            title="Filters"
            class="lg:hidden"
          >
            <u-button :icon="ICONS.filter" />

            <template #body>
              <template v-if="viewModeStore.isCardView">
                <filters
                  :reset-filters
                  :show-reset-filters
                >
                  <filters-search
                    type="Player"
                    :icon="ICONS.player"
                    v-model="players"
                  />

                  <filters-tours
                    v-model="tours"
                    :tour-options="['ATP', 'WTA']"
                  />

                  <filters-search
                    type="Country"
                    placeholder="Countries"
                    :icon="ICONS.globe"
                    v-model="countries"
                  />

                  <filters-search
                    type="Coach"
                    placeholder="Coaches"
                    :icon="ICONS.coach"
                    v-model="coaches"
                  />
                </filters>

                <u-separator />

                <filters-sort-field
                  :reset-sorting
                  :sort-fields
                  v-model="sortField"
                />
              </template>

              <template v-else>
                <table-reset-grouping
                  v-if="grouping"
                  :reset-grouping
                />
                <table-visibility
                  v-if="tableRef?.table"
                  :table="tableRef?.table"
                />
              </template>
            </template>
          </u-slideover>
        </template>
      </u-page-header>

      <u-page-body>
        <players-grid
          v-if="viewModeStore.isCardView"
          :players="data.results"
          :status
        />

        <players-table
          v-else
          ref="tableRef"
          :results="data.results"
          :status
        />
      </u-page-body>
    </u-page>

    <pagination-footer
      :total="data.count"
      :placeholder="footerPlaceholder"
      :show-pagination-controls="viewModeStore.isCardView || !grouping"
      v-model:page="page"
      v-model:items-per-page="itemsPerPage"
    />
  </u-container>
</template>
