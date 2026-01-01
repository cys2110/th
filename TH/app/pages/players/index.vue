<script setup lang="ts">


import type { TableRow } from "@nuxt/ui"
import type { Table } from "@tanstack/vue-table"

useHead({ title: "Players" })

const router = useRouter()
const viewModeStore = useViewModeStore()
const [defineEmptyTemplate, reuseEmptyTemplate] = createReusableTemplate()
const tourOptions = ["ATP", "WTA"]

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

const { data, status } = await useFetch<{ count: number; results: PlayersResultsType[] }>(apiDetails, {
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

const footerPlaceholder = computed(() => {
  if (viewModeStore.isCardView || !grouping.value?.length) {
    return data.value.count === 1 ? "player" : "players"
  } else if (grouping.value.includes("country")) {
    return data.value.count === 1 ? "country" : "countries"
  } else {
    return data.value.count === 1 ? "year" : "years"
  }
  return ""
})

// Table
const table = useTemplateRef<{ tableApi: Table<PlayersResultsType> }>("table")

// Computed in order to pass refs
const columns = computed(() => playerColumns(grouping, tours, players, countries, coaches, sortField))

// Ensure that grouped column is always shown first
const columnOrder = computed(() => {
  const columns = ["tour", "status", "country", "name", "first tournament year", "last tournament year", "coaches"]

  if (grouping.value?.length) {
    if (grouping.value.includes("min_year")) {
      columns.splice(columns.indexOf("first tournament year"), 1)
      return ["first tournament year", ...columns]
    }
    if (grouping.value.includes("max_year")) {
      columns.splice(columns.indexOf("last tournament year"), 1)
      return ["last tournament year", ...columns]
    }

    return [...grouping.value, ...columns.filter(c => !grouping.value?.includes(c))]
  }

  return columns
})

const columnVisibility = ref({
  status: false
})

// In grouped mode, only fetch data when row is expanded
watch(
  () => table.value?.tableApi.getState().expanded,
  async (newExpanded, oldExpanded) => {
    if (!grouping.value?.length || !newExpanded) return

    let newlyOpenedId: string = ""

    for (const [rowId, isOpen] of Object.entries(newExpanded)) {
      const wasOpen = oldExpanded?.[rowId as keyof typeof oldExpanded] ?? false
      if (isOpen && !wasOpen) newlyOpenedId = rowId
    }

    if (!newlyOpenedId) return

    // const keysToFetch = new Set<string | number>()
    let keyToFetch: string | number = ""

    const row = table.value?.tableApi.getRow(newlyOpenedId) as TableRow<PlayersResultsType> | undefined
    if (!row) return

    const dataRow = data.value.results.find(r => r.id === row.original.id)
    const idx = data.value.results.findIndex(r => r.id === row.original.id)
    if (!dataRow || idx === -1) return

    if (dataRow.has_children && dataRow.subRows.length === 0) {
      keyToFetch = dataRow.group_key.key
    }

    if (!keyToFetch) return

    status.value = "pending"

    const apiRoute = grouping.value?.includes("country")
      ? "/api/players/country-group"
      : grouping.value?.includes("min_year")
      ? "/api/players/min-year-group"
      : "/api/players/max-year-group"

    const response = await $fetch<PlayersResultsType[]>(apiRoute, {
      method: "POST",
      body: {
        sortField: sortField.value,
        players: players.value,
        tours: tours.value,
        countries: countries.value,
        coaches: coaches.value,
        key: keyToFetch
      }
    })

    const updated = {
      ...dataRow,
      subRows: response
    }

    data.value = {
      ...data.value,
      results: [...data.value.results.slice(0, idx), updated, ...data.value.results.slice(idx + 1)]
    }

    status.value = "success"
  }
)

// handle row selection
const handleSelectRow = (_e: Event, row: TableRow<PlayersResultsType>) => {
  if (row.original.__group) {
    row.toggleExpanded()
  } else {
    router.push({
      name: "player",
      params: {
        id: row.original.id,
        name: row.original.first_name ? kebabCase(`${row.original.first_name} ${row.original.last_name}`) : "—"
      }
    })
  }
}
</script>

<template>
  <u-container class="min-h-screen flex flex-col">
    <u-page
      class="flex-1"
      :ui="{ center: viewModeStore.isCardView ? 'lg:col-span-6' : 'lg:col-span-8' }"
    >
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
            :table="table"
            :sort-fields
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
          <view-switcher class="hidden md:block" />

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
                :table="table"
                :sort-fields
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
        <!--Empty template-->
        <define-empty-template>
          <empty
            message="No players found"
            :icon="ICONS.peopleOff"
          >
            <dev-only>
              <players-create />
            </dev-only>
          </empty>
        </define-empty-template>

        <!--Card view-->
        <template v-if="viewModeStore.isCardView">
          <div class="scrollbar p-5">
            <u-page-columns v-if="data.count || status === 'pending'">
              <players-card
                v-if="data.count"
                v-for="player in data.results"
                :key="player.id"
                :player
              />

              <players-loading-card
                v-else
                v-for="_ in 6"
                :key="_"
              />
            </u-page-columns>

            <reuse-empty-template v-else />
          </div>
        </template>

        <!--Table view-->
        <u-table
          v-else
          ref="table"
          :data="data.results"
          :columns="columns"
          :loading="status === 'pending'"
          sticky
          render-fallback-value="—"
          @select="handleSelectRow"
          :column-order
          :column-visibility
          :grouping="(grouping as string[])"
          :grouping-options="{
            manualGrouping: true
          }"
          :get-sub-rows="row => row.subRows"
          :ui="{ td: 'empty:p-0' }"
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

    <pagination-footer
      :total="data.count"
      :placeholder="footerPlaceholder"
      v-model:page="page"
      v-model:offset="offset"
      :show-pagination-controls="viewModeStore.isCardView || !grouping?.length"
    />
  </u-container>
</template>
