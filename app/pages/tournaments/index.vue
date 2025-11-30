<script setup lang="ts">
import type { TableColumn, TableRow } from "@nuxt/ui"
import { UBadge } from "#components"

useHead({ title: "Tournaments" })

const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")
const {
  ui: { icons, colors }
} = useAppConfig()

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
  default: () => ({ count: 0, tournaments: [] as TournamentType[] })
})

const [defineEmptyTemplate, reuseEmptyTemplate] = createReusableTemplate()

// Table columns setup
const table = useTemplateRef<any>("table")
const columns: TableColumn<TournamentType>[] = [
  {
    accessorKey: "tours",
    header: "Tours",
    cell: cell => {
      const tours = cell.getValue<(keyof typeof TourEnum)[]>()
      return h(
        "div",
        { class: "flex justify-center items-center gap-1" },
        tours.map(tour => h(UBadge, { key: tour, label: tour, color: tour as keyof typeof colors }))
      )
    }
  },
  { accessorKey: "name", header: "Tournament", cell: cell => cell.renderValue() },
  { accessorKey: "established", header: "Established", cell: cell => cell.renderValue() },
  { accessorKey: "abolished", header: "Abolished", cell: cell => cell.renderValue() }
]

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
          </dev-only>

          <u-button
            label="Reset Filters"
            :icon="ICONS.noFilter"
            @click="resetFilters"
            block
          />

          <u-button
            label="Reset Sorting"
            :icon="ICONS.sortAlpha"
            @click="resetSorting"
            block
          />

          <table-visibility
            v-if="!viewMode && table"
            :table
          />

          <u-checkbox-group
            legend="Tours"
            v-model="tours"
            :items="TOUR_OPTIONS"
            :ui="{ item: 'ml-3' }"
          />

          <form-input-label
            v-model="established"
            type="number"
            placeholder="Established after"
          />

          <form-input-label
            v-model="abolished"
            type="number"
            placeholder="Abolished before"
          />

          <u-form-field label="Sort by">
            <u-field-group
              v-if="sortField.length"
              v-for="(field, index) in sortField"
              :key="field.field"
              class="w-full mb-2"
            >
              <u-select
                v-model="sortField[index]!.field"
                :items="sortFields"
                disabled
              />
              <u-select
                v-model="sortField[index]!.direction"
                :items="SORT_DIRECTIONS"
              />
              <u-button
                :icon="icons.close"
                color="error"
                @click="sortField.splice(index, 1)"
              />
            </u-field-group>
            <form-sort-field
              :sort-fields="sortFields"
              v-model="sortField"
            />
          </u-form-field>
        </u-page-aside>
      </template>

      <template #right>
        <u-page-aside>
          <form-command-palette-search
            type="Tournament"
            v-model="tournaments"
            :icon="ICONS.tournament"
            multiple
          />
        </u-page-aside>
      </template>

      <u-page-header title="Tournaments">
        <template #links>
          <u-tooltip :text="viewMode ? 'Cards' : 'Table'">
            <div>
              <u-switch
                v-model="viewMode"
                :checked-icon="ICONS.cards"
                :unchecked-icon="ICONS.table"
              />
            </div>
          </u-tooltip>

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

              <u-button
                label="Reset Filters"
                :icon="ICONS.noFilter"
                @click="resetFilters"
                block
              />

              <u-button
                label="Reset Sorting"
                :icon="ICONS.sortAlpha"
                @click="resetSorting"
                block
              />

              <table-visibility
                v-if="!viewMode && table"
                :table
              />

              <form-search
                type="Tournament"
                v-model="tournaments"
                :icon="ICONS.tournament"
                multiple
              />

              <u-checkbox-group
                legend="Tours"
                v-model="tours"
                :items="TOUR_OPTIONS"
                :ui="{ item: 'ml-3' }"
              />

              <form-input-label
                v-model="established"
                type="number"
                placeholder="Established after"
              />

              <form-input-label
                v-model="abolished"
                type="number"
                placeholder="Abolished before"
              />

              <u-form-field label="Sort by">
                <u-field-group
                  v-if="sortField.length"
                  v-for="(field, index) in sortField"
                  :key="field.field"
                  class="w-full mb-2"
                >
                  <u-select
                    v-model="sortField[index]!.field"
                    :items="sortFields"
                    disabled
                  />
                  <u-select
                    v-model="sortField[index]!.direction"
                    :items="SORT_DIRECTIONS"
                  />
                  <u-button
                    :icon="icons.close"
                    color="error"
                    @click="sortField.splice(index, 1)"
                  />
                </u-field-group>
                <form-sort-field
                  :sort-fields="sortFields"
                  v-model="sortField"
                />
              </u-form-field>
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
              <u-page-card
                v-if="data.count"
                v-for="tournament in data.tournaments"
                :key="tournament.id.toString()"
                :title="tournament.name"
                highlight
                :to="{ name: 'tournament', params: { id: tournament.id, name: kebabCase(tournament.name) } }"
                :ui="{ root: 'h-full', body: 'w-full', leading: 'flex items-center gap-1' }"
              >
                <template #leading>
                  <u-badge
                    v-for="tour in tournament.tours"
                    :key="tour"
                    :color="(tour as keyof typeof colors)"
                    :label="tour"
                  />
                </template>
                <template #description>
                  <span v-if="tournament.established">{{ tournament.established }}</span>
                  <span v-if="tournament.established && !tournament.abolished"> - present</span>
                  <span v-else-if="tournament.abolished && tournament.established !== tournament.abolished"> - {{ tournament.abolished }}</span>
                </template>
              </u-page-card>
              <loading-base
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
            :columns
            :loading="status === 'pending'"
            sticky
            @select="handleSelect"
            render-fallback-value="—"
            :ui="{ tbody: '[&>tr]:cursor-pointer', root: 'max-h-150' }"
          >
            <template #loading>
              <u-icon
                :name="icons.loading"
                class="size-8"
              />
            </template>
            <template #empty>
              <reuse-empty-template />
            </template>
          </u-table>
        </div>

        <div class="sticky w-full z-50 bg-default bottom-0 mt-auto pt-3 pb-6">
          <div class="grid grid-cols-1 lg:grid-cols-3 justify-items-center">
            <div
              v-if="!mdAndDown"
              class="font-semibold text-muted"
            >
              {{ data.count }} tournament{{ data.count === 1 ? "" : "s" }}
            </div>

            <u-pagination
              v-model:page="page"
              :total="data.count"
              :sibling-count="mdAndDown ? 1 : 2"
              :items-per-page
              active-variant="subtle"
            />

            <u-form-field
              v-if="!mdAndDown"
              label="Items per page"
              class="w-4/5 ml-auto"
            >
              <u-slider
                v-model="itemsPerPage"
                :min="10"
                :max="100"
                :step="5"
                tooltip
              />
            </u-form-field>
          </div>
        </div>
      </u-page-body>
    </u-page>
  </u-container>
</template>
