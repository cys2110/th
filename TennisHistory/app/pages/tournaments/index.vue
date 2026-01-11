<script setup lang="ts">
import type { FetchError } from "ofetch"

useHead({ title: "Tournaments" })

const viewModeStore = useViewModeStore()

// Pagination
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
const resetSorting = () => set(sortField, [])

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
  default: () => ({ count: 0, tournaments: [] as TournamentType[] }),
  onResponseError: ({ error }) => {
    if (typeof error === "object" && "statusMessage" in error) {
      const err = error as FetchError<ValidationError>

      if (err.statusMessage === "Invalid request body") {
        console.error(
          "Validation errors: ",
          err.data?.validationErrors.map(e => `${e.path.join(".")}: ${e.message}`)
        )
      }
    } else {
      console.error(error)
    }
  }
})

const tableRef = useTemplateRef("tableRef")
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
            :table="tableRef?.table"
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

      <template
        #right
        v-if="viewModeStore.isCardView"
      >
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
                :table="tableRef?.table"
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
        <!--Card view-->
        <tournaments-grid
          v-if="viewModeStore.isCardView"
          :tournaments="data.tournaments"
          :status
        />

        <!--Table view-->
        <tournaments-table
          v-else
          ref="tableRef"
          :tournaments="data.tournaments"
          :status
          v-model:tours="tours"
          v-model:tournaments-filters="tournaments"
          v-model:established="established"
          v-model:abolished="abolished"
          v-model:sort-field="sortField"
        />
      </u-page-body>
    </u-page>

    <pagination-footer
      :total="data.count"
      :placeholder="`tournament${data.count === 1 ? '' : 's'}`"
      v-model:page="page"
      v-model:items-per-page="itemsPerPage"
    />
  </u-container>
</template>
