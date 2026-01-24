<script setup lang="ts">
useHead({ title: "Tournaments" })

// Stores
const viewModeStore = useViewModeStore()

// Template refs
const tableRef = useTemplateRef("tableRef")

// Pagination
const page = useRouteQuery("page", 1, { transform: Number })
const itemsPerPage = useRouteQuery("itemsPerPage", 30, { transform: Number })
const skip = computed(() => (get(page) - 1) * get(itemsPerPage))

// Filters
const tours = useRouteQuery("tours", null, { transform: toArray })
const tournaments = useRouteQuery("tournaments", null, {
  transform: {
    get: parseNumberOption,
    set: serialiseOption
  }
})
const established = useRouteQuery("established", null, { transform: Number })
const abolished = useRouteQuery("abolished", null, { transform: Number })

const resetFilters = () => {
  set(tours, null)
  set(tournaments, null)
  set(established, null)
  set(abolished, null)
}

const showResetFilters = computed(() => {
  return get(page) > 1 || get(itemsPerPage) !== 30 || !!tours.value?.length || !!tournaments.value?.length || !!established.value || !!abolished.value
})

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
  { label: "Established", value: "established" },
  { label: "Abolished", value: "abolished" }
]

const resetSorting = () => set(sortField, [])

// Reset page on filter/sort change
watchDeep(
  [tours, tournaments, established, abolished, itemsPerPage, sortField, grouping],
  () => {
    set(page, 1)
  },
  { immediate: true }
)

// API call
const apiRoute = computed(() => {
  if (grouping.value && !viewModeStore.isCardView) {
    return "/api/tournaments/groups"
  }
  return "/api/tournaments"
})

const { data, status, error } = await useFetch<{ count: number; results: TournamentResultsType[] }>(apiRoute, {
  method: "POST",
  body: {
    skip,
    itemsPerPage,
    sortField,
    tournaments,
    tours,
    established,
    abolished,
    grouping
  },
  default: () => ({ count: 0, results: [] })
})

watch(
  error,
  () => {
    if (error.value) {
      if (error.value.statusMessage) {
        console.error(error.value.statusMessage, error.value.data?.data.validationErrors)
      } else {
        console.error(error.value)
      }
    }
  },
  { immediate: true }
)

const yearOptions = Array.from({ length: new Date().getFullYear() - 1876 }, (_, i) => 1877 + i)

const footerPlaceholder = computed(() => {
  if (viewModeStore.isCardView || !grouping.value) {
    return get(data).count === 1 ? "tournament" : "tournaments"
  }
  return get(data).count === 1 ? "group" : "groups"
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
            <tournament-update />

            <u-separator />
          </dev-only>

          <template v-if="viewModeStore.isCardView">
            <filters
              :show-reset-filters
              @reset-filters="resetFilters"
            >
              <filters-tours v-model="tours" />

              <filters-years
                v-model="established"
                :year-options
                placeholder="Established"
              />

              <filters-years
                v-model="abolished"
                :year-options
                placeholder="Abolished"
              />
            </filters>

            <u-separator />

            <filters-sort-field
              :sort-fields
              v-model="sortField"
              @reset-sorting="resetSorting"
            />
          </template>

          <template v-else>
            <table-reset-grouping
              v-if="grouping"
              @reset-grouping="resetGrouping"
            />

            <table-visibility
              v-if="tableRef?.table"
              :table="tableRef.table"
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
            :icon="ICONS.trophy"
            type="Tournament"
            v-model="tournaments"
          />
        </u-page-aside>
      </template>

      <u-page-header title="Tournaments">
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
                    type="Tournament"
                    :icon="ICONS.trophy"
                    v-model="tournaments"
                  />

                  <filters-tours v-model="tours" />

                  <filters-years
                    v-model="established"
                    :year-options
                    placeholder="Established"
                  />

                  <filters-years
                    v-model="abolished"
                    :year-options
                    placeholder="Abolished"
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
        <tournaments-grid
          v-if="viewModeStore.isCardView"
          :tournaments="data.results"
          :status
        />

        <tournaments-table
          v-else
          ref="tableRef"
          v-model:results="data.results"
          v-model:status="status"
        />
      </u-page-body>
    </u-page>

    <pagination-footer
      :total="data.count"
      :placeholder="footerPlaceholder"
      v-model:page="page"
      v-model:items-per-page="itemsPerPage"
      :show-pagination-controls="viewModeStore.isCardView || !grouping"
    />
  </u-container>
</template>
