<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"
import { CalendarDate } from "@internationalized/date"
import { DevOnly, PersonUpdate, UButton, VenuesUpdate } from "#components"

useHead({ title: "Results Archive" })

const router = useRouter()
const {
  ui: { icons }
} = useAppConfig()

// Pagination / view
const page = useRouteQuery("page", 1, { transform: Number })
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
const sortField = ref<SortFieldType[]>([])
const sortFields = [{ label: "Date", value: "start_date" }]

const resetSorting = () => {
  sortField.value = []
}

watchDeep(
  [tournaments, tours, levels, categories, surfaces, venues, countries, supervisors, umpires, years, dateRange, environment, itemsPerPage, sortField],
  () => set(page, 1),
  { immediate: true }
)

// API call
// const { data, status } = await useFetch("/api/results-archive", {
//   method: "POST",
//   body: {
//     skip,
//     offset: itemsPerPage,
//     sortField,
//     tournaments,
//     tours,
//     levels,
//     categories,
//     surfaces,
//     venues,
//     countries,
//     supervisors,
//     umpires,
//     years,
//     dateRange,
//     environment
//   },
//   default: () => ({ count: 0, editions: [] })
// })

// // Table columns setup
// const table = useTemplateRef<any>("table")

// const columnPinning = ref({
//   left: ["tournament"],
//   right: []
// })

// const handleSelect = (e: Event, row: TableRow<any>) => {
//   router.push({
//     name: "edition",
//     params: {
//       id: row.original.tournament.id,
//       name: kebabCase(row.original.tournament.name),
//       year: row.original.year,
//       edId: row.original.id
//     }
//   })
// }
</script>

<template>
  <u-container class="min-h-screen">
    <!-- <u-page>
      <template #left>
        <u-page-aside>
          <dev-only>
            <venues-update />
            <person-update type="Supervisor" />
            <person-update type="Umpire" />
            <lazy-coaches-merge hydrate-on-interaction="mouseover" />
            <lazy-umpires-merge hydrate-on-interaction="mouseover" />
            <u-separator />
          </dev-only>-->

    <!--@vue-expect-error-->
    <!--<filters
            :filters="[
              'tours',
              'levels',
              'countries',
              'umpires',
              'supervisors',
              'venues',
              'years',
              'environment',
              'surfaces',
              'categories',
              'dateRange'
            ]"
            v-model:tours="tours"
            v-model:levels="levels"
            v-model:sorting="sortField"
            v-model:countries="countries"
            v-model:supervisors="supervisors"
            v-model:umpires="umpires"
            v-model:venues="venues"
            v-model:years="years"
            v-model:environment="environment"
            v-model:surfaces="surfaces"
            v-model:categories="categories"
            v-model:dateRange="dateRange"
            :sort-fields="sortFields"
            :reset-filters
            :reset-sorting
            :table
          />
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
        <template #links>-->
    <!--Filters for smaller screens-->
    <!-- <u-slideover
            title="Filters"
            class="ml-auto lg:hidden"
          >
            <u-button :icon="ICONS.filter" />

            <template #body> -->
    <!--@vue-expect-error-->
    <!--<filters
                :filters="[
                  'tours',
                  'levels',
                  'countries',
                  'umpires',
                  'supervisors',
                  'venues',
                  'years',
                  'environment',
                  'surfaces',
                  'categories',
                  'dateRange',
                  'tournaments'
                ]"
                v-model:tours="tours"
                v-model:levels="levels"
                v-model:sorting="sortField"
                v-model:countries="countries"
                v-model:supervisors="supervisors"
                v-model:umpires="umpires"
                v-model:venues="venues"
                v-model:years="years"
                v-model:environment="environment"
                v-model:surfaces="surfaces"
                v-model:categories="categories"
                v-model:dateRange="dateRange"
                v-model:tournaments="tournaments"
                :sort-fields="sortFields"
                :reset-filters
                :reset-sorting
                :table
              />
            </template>
          </u-slideover>
        </template>
      </u-page-header>

      <u-page-body>
        <div class="flex-1">
          <u-table
            ref="table"
            :data="data.editions"
            :columns="archiveColumns"
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
              <loading-icon />
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
      </u-page-body>
    </u-page>

    <counts
      :total="data.count"
      type="editions"
      v-model:page="page"
      v-model:items-per-page="itemsPerPage"
    /> -->
  </u-container>
</template>
