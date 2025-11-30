<script setup lang="ts">
import type { TableColumn, TableRow } from "@nuxt/ui"
import { CalendarDate } from "@internationalized/date"
import { CountriesLink, DevOnly, PersonUpdate, UBadge, UButton, VenuesUpdate } from "#components"

useHead({ title: "Results Archive" })

const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")
const {
  ui: { icons }
} = useAppConfig()

// Pagination / view
const page = ref(1)
const itemsPerPage = ref(40)
const skip = computed(() => (page.value - 1) * itemsPerPage.value)

// Filters
const tours = ref([])
const tournaments = ref([])
const levels = ref([])
const categories = ref([])
const dateRange = ref<{ start: CalendarDate | undefined; end: CalendarDate | undefined }>({
  start: undefined,
  end: undefined
})
const surfaces = ref([])
const venues = ref([])
const countries = ref([])
const supervisors = ref([])
const umpires = ref([])
const years = ref([])
const environment = ref()

const resetFilters = () => {
  const arrayKeys = [tours, tournaments, levels, categories, surfaces, venues, countries, supervisors, umpires, years]

  arrayKeys.forEach(key => {
    key.value = []
  })
  dateRange.value = { start: undefined, end: undefined }
  environment.value = undefined
}

// Sorting
const sortField = ref<SortFieldType>([{ field: "start_date", direction: "DESC" }])
const sortFields = [{ label: "Date", value: "start_date" }]

const resetSorting = () => {
  sortField.value = [{ field: "start_date", direction: "DESC" }]
}

watchDeep(
  [tournaments, tours, levels, categories, surfaces, venues, countries, supervisors, umpires, years, dateRange, environment, itemsPerPage, sortField],
  () => set(page, 1),
  { immediate: true }
)

// API call
const { data, status } = await useFetch("/api/results-archive", {
  method: "POST",
  body: {
    skip,
    offset: itemsPerPage,
    sortField,
    tournaments,
    tours,
    levels,
    categories,
    surfaces,
    venues,
    countries,
    supervisors,
    umpires,
    years,
    dateRange,
    environment
  },
  default: () => ({ count: 0, editions: [] })
})

// Table columns setup
const table = useTemplateRef<any>("table")
const columns: TableColumn<any>[] = [
  {
    id: "tournament",
    header: "Tournament",
    cell: ({ row }) =>
      h("div", { class: "flex items-center gap-1" }, [
        h(UButton, {
          icon: row.getIsExpanded() ? icons.minus : icons.plus,
          color: "neutral",
          size: "xs",
          variant: "ghost",
          class: !row.getCanExpand() && "invisible",
          onClick: row.getToggleExpandedHandler()
        }),
        h("div", { class: "flex flex-col items-center w-full" }, [
          h("div", { class: "font-semibold" }, row.original.tournament?.name),
          h("div", { class: "text-sm text-muted" }, row.original.sponsor_name)
        ])
      ])
  },
  { accessorKey: "year", header: "Year" },
  {
    accessorKey: "tour",
    header: "Tour",
    cell: ({ row }) => {
      if (row.original.tour) {
        return h(UBadge, { label: row.original.tour, color: row.original.tour })
      }
    }
  },
  {
    accessorKey: "level",
    header: "Level",
    cell: ({ row }) => {
      if (row.original.tour) {
        return h(UBadge, { label: row.original.level, color: row.original.level })
      }
    }
  },
  { accessorKey: "category", header: "Category" },
  {
    id: "dates",
    header: "Dates",
    cell: ({ row }) => {
      if (row.original.start_date && row.original.end_date) {
        return mdAndDown.value
          ? shortDateFormat.formatRange(new Date(row.original.start_date), new Date(row.original.end_date))
          : dateTimeFormat.formatRange(new Date(row.original.start_date), new Date(row.original.end_date))
      }
    }
  },
  { id: "surface", accessorKey: "surface.id", header: "Surface" },
  {
    accessorKey: "venues",
    header: "Venues",
    cell: ({ row }) =>
      h(
        "div",
        { class: "flex flex-col items-center" },
        row.original.venues?.map((venue: VenueType) =>
          h(
            DevOnly,
            {},
            {
              default: () => h(VenuesUpdate, { venue }),
              fallback: () =>
                h("div", { class: "flex items-center gap-2" }, [
                  venue.name ? `${venue.name}, ${venue.city}` : venue.city,
                  h(CountriesLink, { country: venue.country })
                ])
            }
          )
        )
      )
  },
  {
    accessorKey: "supervisors",
    header: "Supervisors",
    cell: ({ row }) =>
      h(
        "div",
        { class: "flex flex-col items-center" },
        row.original.supervisors?.map((supervisor: PersonType) =>
          h(
            DevOnly,
            {},
            {
              default: () => h(PersonUpdate, { type: "Supervisor", person: supervisor }),
              fallback: () => `${supervisor.first_name} ${supervisor.last_name}`
            }
          )
        )
      )
  },
  {
    accessorKey: "umpires",
    header: "Umpires",
    cell: ({ row }) =>
      h(
        "div",
        { class: "flex flex-col items-center" },
        row.original.umpires?.map((umpire: PersonType) =>
          h(
            DevOnly,
            {},
            {
              default: () => h(PersonUpdate, { type: "Umpire", person: umpire }),
              fallback: () => `${umpire.first_name} ${umpire.last_name}`
            }
          )
        )
      )
  }
]

const columnPinning = ref({
  left: ["tournament"],
  right: []
})

const handleSelect = async (e: Event, row: TableRow<any>) => {
  if (row.getCanExpand()) {
    await navigateTo({
      name: "edition",
      params: {
        id: row.original.tournament.id,
        name: kebabCase(row.original.tournament.name),
        year: row.original.year,
        edId: row.original.id
      }
    })
  } else {
    await navigateTo({
      name: "event",
      params: {
        id: row.getParentRow()?.original.tournament.id,
        name: kebabCase(row.getParentRow()?.original.tournament.name),
        year: row.getParentRow()?.original.year,
        edId: row.getParentRow()?.original.id,
        tour: row.original.tour
      }
    })
  }
}
</script>

<template>
  <u-container class="min-h-screen">
    <u-page>
      <template #left>
        <u-page-aside>
          <dev-only>
            <venues-update />
            <person-update type="Supervisor" />
            <person-update type="Umpire" />
            <coaches-merge />
            <umpires-merge />
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
            v-if="table"
            :table
          />

          <u-checkbox-group
            legend="Tours"
            v-model="tours"
            :items="TOUR_OPTIONS"
            :ui="{ item: 'ml-3' }"
          />

          <u-checkbox-group
            legend="Level"
            v-model="levels"
            :items="LEVEL_OPTIONS"
            :ui="{ item: 'ml-3' }"
          />

          <!--@vue-expect-error-->
          <form-dates-picker
            v-model="dateRange"
            placeholder="Filter by date range"
          />

          <form-input-menu
            v-model="years"
            placeholder="Filter by year"
            :items="ALL_YEARS"
            :icon="ICONS.event"
            multiple
          />

          <form-input-tags
            v-model="categories"
            placeholder="Filter by categories"
            :icon="ICONS.categories"
          />

          <u-radio-group
            legend="Environment"
            v-model="environment"
            :items="['Indoor', 'Outdoor']"
            :ui="{ item: 'ml-3' }"
          />

          <u-checkbox-group
            legend="Surfaces"
            v-model="surfaces"
            :items="['Clay', 'Grass', 'Hard', 'Carpet']"
            :ui="{ item: 'ml-3' }"
          />

          <form-search
            placeholder="Filter by venues"
            type="Venue"
            v-model="venues"
            :icon="ICONS.venue"
            multiple
          />

          <form-search
            placeholder="Filter by countries"
            v-model="countries"
            type="Country"
            :icon="ICONS.countries"
            multiple
          />

          <form-search
            placeholder="Filter by supervisors"
            type="Supervisor"
            v-model="supervisors"
            :icon="ICONS.supervisor"
            multiple
          />

          <form-search
            placeholder="Filter by umpires"
            type="Umpire"
            v-model="umpires"
            :icon="ICONS.umpire"
            multiple
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

      <u-page-header title="Results Archive">
        <template
          #links
          v-if="mdAndDown"
        >
          <!--Filters for smaller screens-->
          <u-slideover
            title="Filters"
            class="ml-auto"
          >
            <u-button :icon="ICONS.filter" />

            <template #body>
              <dev-only>
                <venues-update />
                <person-update type="Supervisor" />
                <person-update type="Umpire" />
                <coaches-merge />
                <umpires-merge />
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
                v-if="table"
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

              <u-checkbox-group
                legend="Level"
                v-model="levels"
                :items="LEVEL_OPTIONS"
                :ui="{ item: 'ml-3' }"
              />

              <!--@vue-expect-error-->
              <form-dates-picker
                v-model="dateRange"
                placeholder="Filter by date range"
              />

              <form-input-menu
                v-model="years"
                placeholder="Filter by year"
                :items="ALL_YEARS"
                :icon="ICONS.event"
                multiple
              />

              <form-input-tags
                v-model="categories"
                placeholder="Filter by categories"
                :icon="ICONS.categories"
              />

              <u-radio-group
                legend="Environment"
                v-model="environment"
                :items="['Indoor', 'Outdoor']"
                :ui="{ item: 'ml-3' }"
              />

              <u-checkbox-group
                legend="Surfaces"
                v-model="surfaces"
                :items="['Clay', 'Grass', 'Hard', 'Carpet']"
                :ui="{ item: 'ml-3' }"
              />

              <form-search
                placeholder="Filter by venues"
                type="Venue"
                v-model="venues"
                :icon="ICONS.venue"
                multiple
              />

              <form-search
                placeholder="Filter by countries"
                v-model="countries"
                type="Country"
                :icon="ICONS.countries"
                multiple
              />

              <form-search
                placeholder="Filter by supervisors"
                type="Supervisor"
                v-model="supervisors"
                :icon="ICONS.supervisor"
                multiple
              />

              <form-search
                placeholder="Filter by umpires"
                type="Umpire"
                v-model="umpires"
                :icon="ICONS.umpire"
                multiple
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

      <u-page-body>
        <div class="flex-1">
          <u-table
            ref="table"
            :data="data.editions"
            :columns
            :loading="status === 'pending'"
            sticky
            render-fallback-value="—"
            :get-sub-rows="row => row.events"
            v-model:column-pinning="columnPinning"
            @select="handleSelect"
            :ui="{
              base: 'border-separate border-spacing-0',
              root: 'max-h-150',
              tbody: '[&>tr]:last:[&>td]:border-b-0 [&>tr]:cursor-pointer [&>tr]:hover:bg-elevated/50',
              tr: 'group',
              td: 'empty:p-0 group-has-[td:not(:empty)]:border-b border-default'
            }"
          >
            <template #loading>
              <u-icon
                :name="icons.loading"
                class="size-8"
              />
            </template>
            <template #empty>
              <empty
                message="No editions found"
                :icon="ICONS.edition"
                class="mx-2"
              />
            </template>
          </u-table>
        </div>

        <div class="sticky w-full z-50 bg-default bottom-0 mt-auto pt-3 pb-6">
          <div class="grid grid-cols-1 lg:grid-cols-3 justify-items-center">
            <div
              v-if="!mdAndDown"
              class="font-semibold text-muted"
            >
              {{ data.count }} edition{{ data.count === 1 ? "" : "s" }}
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
