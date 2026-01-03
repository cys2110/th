<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"

useHead({ title: "Tournaments" })
const router = useRouter()

const viewModeStore = useViewModeStore()
const [defineEmptyTemplate, reuseEmptyTemplate] = createReusableTemplate()

const page = useRouteQuery("page", 1, { transform: Number })
const itemsPerPage = ref(30)
const skip = computed(() => (page.value - 1) * itemsPerPage.value)

// Filters
const tours = useRouteQuery("tours", null, { transform: val => toArray(val) })
const tournaments = useRouteQuery("tournaments", null, {
  transform: {
    get: (val: string | null): OptionType[] => parseOption(val),
    set: (val: OptionType[]): string | null => serialiseOption(val)
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

// Sorting
const sortField = useRouteQuery("sorting", null, {
  transform: {
    get: (val: string | null): SortFieldType[] => parseSort(val),
    set: (val: SortFieldType[]): string | null => serialiseSort(val)
  }
})
const sortFields = [
  { label: "Name", value: "name" },
  { label: "Established", value: "established" },
  { label: "Abolished", value: "abolished" }
]
const resetSorting = () => set(sortField, null)

// Reset page on filter/sort change
watchDeep(
  [tours, tournaments, established, abolished, itemsPerPage, sortField],
  () => {
    set(page, 1)
  },
  { immediate: true }
)

// API call
const { data, status } = await useFetch("/api/tournaments", {
  method: "POST",
  body: {
    skip,
    offset: itemsPerPage,
    sortField,
    tournaments,
    tours,
    established,
    abolished
  },
  default: () => ({ count: 0, tournaments: [] })
})

// Table options
const table = useTemplateRef<any>("table")
const columns = computed(() => tournamentColumns(tours, tournaments, established, abolished, sortField))

const handleSelectRow = (_e: Event, row: TableRow<TournamentType>) => {
  const { id, name } = row.original
  router.push({
    name: "tournament",
    params: {
      id,
      name: kebabCase(name)
    }
  })
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
            <tournaments-update />
            <u-separator />
          </dev-only>

          <filters
            :reset-filters
            :reset-sorting
            :table="table"
            :sort-fields
            v-model:sorting="sortField"
          >
            <filters-tours v-model="tours" />

            <filters-years
              v-model="established"
              :year-options="Array.from({ length: new Date().getFullYear() - 1877 + 1 }, (_, i) => 1877 + i)"
              placeholder="Established"
            />

            <filters-years
              v-model="abolished"
              :year-options="Array.from({ length: new Date().getFullYear() - 1877 + 1 }, (_, i) => 1877 + i)"
              placeholder="Abolished"
            />
          </filters>
        </u-page-aside>
      </template>

      <template #right>
        <u-page-aside>
          <filters-command-palette-search
            type="Tournament"
            v-model="tournaments"
            :icon="ICONS.trophy"
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
              <filters
                :reset-filters
                :reset-sorting
                :table="table"
                :sort-fields
                v-model:sorting="sortField"
              >
                <filters-search
                  type="Tournament"
                  :icon="ICONS.trophy"
                  v-model="tournaments"
                />

                <filters-tours v-model="tours" />

                <filters-years
                  v-model="established"
                  :year-options="Array.from({ length: new Date().getFullYear() - 1877 + 1 }, (_, i) => 1877 + i)"
                  placeholder="Established"
                />

                <filters-years
                  v-model="abolished"
                  :year-options="Array.from({ length: new Date().getFullYear() - 1877 + 1 }, (_, i) => 1877 + i)"
                  placeholder="Abolished"
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
            message="No tournaments found"
            :icon="ICONS.trophyOff"
          >
            <dev-only>
              <tournaments-update />
            </dev-only>
          </empty>
        </define-empty-template>

        <template v-if="viewModeStore.isCardView">
          <u-page-grid
            v-if="data.count || status === 'pending'"
            class="p-5"
          >
            <tournaments-card
              v-if="data.count"
              v-for="tournament in data.tournaments"
              :key="tournament.id.toString()"
              :tournament
            />

            <loading-card
              v-else
              v-for="_ in 6"
              :key="_"
            />
          </u-page-grid>

          <reuse-empty-template v-else />
        </template>

        <u-table
          v-else
          ref="table"
          :data="data.tournaments"
          :columns="columns"
          :loading="status === 'pending'"
          sticky
          @select="handleSelectRow"
          render-fallback-value="—"
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
      :placeholder="`tournament${data.count === 1 ? '' : 's'}`"
    />
  </u-container>
</template>
