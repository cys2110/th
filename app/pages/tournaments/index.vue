<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"
import { TournamentsColumns } from "#components"

useHead({ title: "Tournaments" })

const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")

// Pagination / view
const viewMode = ref(true)
const page = ref(1)
const itemsPerPage = ref(40)
const skip = computed(() => (page.value - 1) * itemsPerPage.value)

// Filters
const tours = ref([])
const tournaments = ref([])
const established = ref<number | undefined>()
const abolished = ref<number | undefined>()
const resetFilters = () => {
  ;[tours, tournaments].forEach(filter => (filter.value = []))
  set(established, undefined)
  set(abolished, undefined)
}

// Sorting
const sortField = ref<SortFieldType>([{ field: "name", direction: "ASC" }])
const sortFields = [
  { label: "Name", value: "name" },
  { label: "Established", value: "established" },
  { label: "Abolished", value: "abolished" }
]
const resetSorting = () => {
  sortField.value = [{ field: "name", direction: "ASC" }]
}

// Reset page on filter/sort change
watch([tours, tournaments, established, abolished, itemsPerPage, sortField], () => {
  set(page, 1)
})

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

const [defineEmptyTemplate, reuseEmptyTemplate] = createReusableTemplate()

// Table columns setup
const table = useTemplateRef<any>("table")

const handleSelect = async (e: Event, row: TableRow<TournamentType>) => {
  await navigateTo({ name: "tournament", params: { id: row.original.id, name: kebabCase(row.original.name ?? "-") } })
}
</script>

<template>
  <u-container class="min-h-screen">
    <u-page>
      <template #left>
        <u-page-aside>
          <dev-only>
            <tournaments-update />

            <u-separator />
          </dev-only>

          <ResetFilters :reset-filters="resetFilters" />

          <ResetSorting :reset-sorting="resetSorting" />

          <table-visibility
            v-if="!viewMode && table"
            :table
          />

          <tournaments-filters
            location="aside"
            v-model:tours="tours"
            v-model:established="established"
            v-model:sorting="sortField"
            :sort-fields="sortFields"
          />
        </u-page-aside>
      </template>

      <template #right>
        <u-page-aside>
          <form-command-palette-search
            type="Tournament"
            v-model="tournaments"
            :icon="ICONS.tournament"
          />
        </u-page-aside>
      </template>

      <u-page-header title="Tournaments">
        <template #links>
          <view-switcher v-model="viewMode" />

          <!--Filters for smaller screens-->
          <u-slideover
            v-if="mdAndDown"
            title="Filters"
            class="ml-auto"
          >
            <u-button :icon="ICONS.filter" />

            <template #body>
              <dev-only>
                <tournaments-update />
              </dev-only>

              <ResetFilters :reset-filters />

              <ResetSorting :reset-sorting />

              <table-visibility
                v-if="!viewMode && table"
                :table
              />

              <tournaments-filters
                location="slideover"
                v-model:tournaments="tournaments"
                v-model:tours="tours"
                v-model:established="established"
                v-model:sorting="sortField"
                :sort-fields="sortFields"
              />
            </template>
          </u-slideover>
        </template>
      </u-page-header>

      <u-page-body class="h-full flex flex-col">
        <!--Empty template-->
        <define-empty-template>
          <empty
            message="No tournaments found"
            :icon="ICONS.noTournament"
            class="mx-2"
          >
            <dev-only>
              <tournaments-update />
            </dev-only>
          </empty>
        </define-empty-template>

        <div class="flex-1">
          <!--Card view-->
          <template v-if="viewMode">
            <u-page-grid v-if="data.count || status === 'pending'">
              <tournaments-card
                v-if="data.count"
                v-for="tournament in data.tournaments"
                :key="tournament.id.toString()"
                :tournament
              />

              <loading-tournament
                v-else
                v-for="_ in 6"
                :key="_"
              />
            </u-page-grid>
            <reuse-empty-template v-else />
          </template>

          <!--Table view-->
          <u-table
            v-else
            ref="table"
            :data="data.tournaments"
            :columns="TournamentsColumns"
            :loading="status === 'pending'"
            sticky
            @select="handleSelect"
            render-fallback-value="—"
            :ui="{ tbody: '[&>tr]:cursor-pointer', root: 'max-h-150' }"
          >
            <template #loading>
              <loading-icon />
            </template>
            <template #empty>
              <reuse-empty-template />
            </template>
          </u-table>
        </div>

        <counts
          :total="data.count"
          type="tournament"
          v-model:page="page"
          v-model:items-per-page="itemsPerPage"
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
