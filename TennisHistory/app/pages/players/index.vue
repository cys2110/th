<script setup lang="ts">
useHead({ title: "Players" })
const viewModeStore = useViewModeStore()
const tourOptions = ["ATP", "WTA"]
const tableRef = useTemplateRef("tableRef")

// Pagination
const page = useRouteQuery("page", 1, { transform: Number })
const offset = useRouteQuery("pageSize", 30, { transform: Number })
const skip = computed(() => (page.value - 1) * offset.value)

// Filters
const players = useRouteQuery("players", null, {
  transform: {
    get: (val: string | null): OptionType[] => parseOption(val),
    set: (val: OptionType[]): string | null => serialiseOption(val)
  }
})
const countries = useRouteQuery("countries", null, {
  transform: {
    get: (val: string | null): OptionType[] => parseOption(val),
    set: (val: OptionType[]): string | null => serialiseOption(val)
  }
})
const tours = useRouteQuery("tours", null, { transform: val => toArray(val) })
const coaches = useRouteQuery("coaches", null, {
  transform: {
    get: (val: string | null): OptionType[] => parseOption(val),
    set: (val: OptionType[]): string | null => serialiseOption(val)
  }
})

const resetFilters = () => {
  set(players, null)
  set(countries, null)
  set(tours, null)
  set(coaches, null)
}

// Grouping
const grouping = useRouteQuery("grouping", null, { transform: val => toArray(val) })
const resetGrouping = () => set(grouping, null)

// Sorting
const sortField = useRouteQuery("sorting", null, {
  transform: {
    get: (val: string | null): SortFieldType[] => parseSort(val),
    set: (val: SortFieldType[]): string | null => serialiseSort(val)
  }
})
const sortFields = [
  { label: "Name", value: "name" },
  { label: "Country", value: "country" },
  { label: "Year of First Tournament", value: "min_year" },
  { label: "Year of Last Tournament", value: "max_year" }
]
const resetSorting = () => set(sortField, null)

// Reset page on filter/sort change
watchDeep(
  [tours, players, countries, coaches, offset, sortField, grouping],
  () => {
    set(page, 1)
  },
  { immediate: true }
)

// API call
const apiDetails = computed(() => {
  if (grouping.value?.length && !viewModeStore.isCardView) {
    return "/api/players/groups"
  }
  return "/api/players"
})

const { data, status, error } = await useFetch<{ count: number; results: PlayersResultsType[] }>(apiDetails, {
  method: "POST",
  body: {
    skip,
    offset,
    sortField,
    players,
    tours,
    countries,
    coaches,
    grouping
  },
  default: () => ({ count: 0, results: [] })
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

const footerPlaceholder = computed(() => {
  if (viewModeStore.isCardView || !grouping.value?.length) {
    return data.value.count === 1 ? "player" : "players"
  } else if (grouping.value.includes("country")) {
    return data.value.count === 1 ? "country" : "countries"
  } else {
    return data.value.count === 1 ? "year" : "years"
  }
})
</script>

<template>
  <u-container class="min-h-screen flex flex-col">
    <u-page :ui="{ root: 'flex-1', center: viewModeStore.isCardView ? 'lg:col-span-6' : 'lg:col-span-8' }">
      <template #left>
        <u-page-aside>
          <dev-only>
            <players-create />

            <u-separator />
          </dev-only>

          <filters
            :reset-filters
            :reset-sorting
            :reset-grouping
            :sort-fields
            :table="tableRef?.table"
            v-model:sorting="sortField"
          >
            <filters-tours
              v-model="tours"
              :tour-options
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
        </u-page-aside>
      </template>

      <template
        #right
        v-if="viewModeStore.isCardView"
      >
        <u-page-aside>
          <filters-command-palette-search
            type="Player"
            v-model="players"
            :icon="ICONS.player"
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
              <filters
                :reset-filters
                :reset-sorting
                :sort-fields
                :table="tableRef?.table"
                v-model:sorting="sortField"
              >
                <filters-search
                  type="Player"
                  :icon="ICONS.player"
                  v-model="players"
                />

                <filters-tours
                  v-model="tours"
                  :tour-options
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
          v-model:results="data.results"
          v-model:status="status"
          v-model:grouping="grouping"
          v-model:tours="tours"
          v-model:players="players"
          v-model:countries="countries"
          v-model:coaches="coaches"
          v-model:sort-field="sortField"
        />
      </u-page-body>
    </u-page>

    <pagination-footer
      :total="data.count"
      :placeholder="footerPlaceholder"
      v-model:page="page"
      v-model:offset="offset"
      :show-pagination-controls="viewModeStore.isCardView || !grouping?.length"
    />
  </u-container>
</template>
