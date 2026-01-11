<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"
import { getGroupedRowModel } from "@tanstack/vue-table"

useHead({ title: "Players" })
const router = useRouter()

const viewMode = ref(true)
const page = useRouteQuery("page", 1, { transform: Number })
const itemsPerPage = ref(30)
const skip = computed(() => (page.value - 1) * itemsPerPage.value)

const [defineEmptyTemplate, reuseEmptyTemplate] = createReusableTemplate()

const players = ref([])
const countries = ref([])
const tours = ref([])
const coaches = ref([])
const min_year = ref<number>()
const max_year = ref<number>()
const status = ref<string>()

const resetFilters = () => {
  const arrayFilters = [players, countries, tours, coaches]
  const undefinedFilters = [min_year, max_year, status]
  arrayFilters.forEach(filter => set(filter, []))
  undefinedFilters.forEach(filter => (filter.value = undefined))
}

const sortField = ref<SortFieldType[]>([])
const sortFields = [
  { label: "Name", value: "name" },
  { label: "Country", value: "country" },
  { label: "Year of First Tournament", value: "min_year" },
  { label: "Year of Last Tournament", value: "max_year" }
]

const resetSorting = () => set(sortField, [])

// Reset page on filter/sort change
watchDeep(
  [tours, players, countries, coaches, min_year, max_year, status, itemsPerPage, sortField],
  () => {
    set(page, 1)
  },
  { immediate: true }
)

// API call
// const { data, status: apiStatus } = await useFetch("/api/players", {
//   method: "POST",
//   body: {
//     skip,
//     offset: itemsPerPage,
//     sortField,
//     players,
//     tours,
//     countries,
//     coaches,
//     min_year,
//     max_year,
//     status
//   },
//   default: () => ({ count: 0, players: [] })
// })

// const table = useTemplateRef<any>("table")
// const handleSelect = (e: Event, row: TableRow<BasePlayerType>) => {
//   if (!row.getIsGrouped()) {
//     router.push({
//       name: "player",
//       params: {
//         id: row.original.id,
//         name: row.original.first_name ? kebabCase(`${row.original.first_name} ${row.original.last_name}`) : "—"
//       }
//     })
//   }
// }
</script>

<template>
  <u-container class="min-h-screen flex flex-col">
    <!-- <u-page class="flex-1">
      <template #left>
        <u-page-aside>
          <dev-only>
            <players-create />
            <u-separator />
          </dev-only>

          <filters
            :filters="['tours', 'status', 'min_year', 'max_year', 'coaches', 'countries']"
            :reset-filters
            :reset-sorting
            :table
            v-model:tours="tours"
            v-model:status="status"
            v-model:min_year="min_year"
            v-model:max_year="max_year"
            v-model:coaches="coaches"
            v-model:countries="countries"
            v-model:sorting="sortField"
            :sort-fields="sortFields"
          />
        </u-page-aside>
      </template>

      <template #right>
        <u-page-aside>
          <form-command-palette-search
            type="Player"
            v-model="players"
            :icon="ICONS.player"
          />
        </u-page-aside>
      </template>

      <u-page-header title="Players">
        <template #links>
          <view-switcher
            v-model="viewMode"
            class="hidden md:block"
          />-->

    <!--Filters for smaller screens-->
    <!-- <u-slideover
            title="Filters"
            class="ml-auto lg:hidden"
          >
            <u-button :icon="ICONS.filter" />

            <template #body>
              <filters
                :filters="['tours', 'status', 'min_year', 'max_year', 'coaches', 'countries', 'players']"
                :reset-filters
                :reset-sorting
                :table
                v-model:tours="tours"
                v-model:status="status"
                v-model:min_year="min_year"
                v-model:max_year="max_year"
                v-model:coaches="coaches"
                v-model:countries="countries"
                v-model:players="players"
                v-model:sorting="sortField"
                :sort-fields="sortFields"
              />
            </template>
          </u-slideover>
        </template>
      </u-page-header>

      <u-page-body> -->
    <!--Empty template-->
    <!--<define-empty-template>
          <empty
            message="No players found"
            :icon="ICONS.noPeople"
            class="mx-2"
          >
            <dev-only>
              <players-create />
            </dev-only>
          </empty>
        </define-empty-template>

        <template v-if="viewMode">
          <u-page-columns v-if="data.count || status === 'pending'">
            <players-card
              v-if="data.count"
              v-for="player in data.players"
              :key="player.id"
              :player
            />

            <loading-player
              v-else
              v-for="_ in 6"
              :key="_"
            />
          </u-page-columns>

          <reuse-empty-template v-else />
        </template>

        <u-table
          v-else
          ref="table"
          :data="data.players"
          :columns="playersColumns"
          :loading="apiStatus === 'pending'"
          :grouping-options="{
            getGroupedRowModel: getGroupedRowModel()
          }"
          sticky
          @select="handleSelect"
          render-fallback-value="—"
          :meta="{ class: {
            tr: (row: TableRow<BasePlayerType>) => row.getIsGrouped() ? 'cursor-default' : `cursor-pointer bg-${row.original.tour}/10`
          }}"
          :ui="{
            root: 'max-h-200 xl:max-h-160',
            td: 'empty: p-0'
          }"
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

    <counts
      :total="data.count"
      type="player"
      v-model:page="page"
      v-model:items-per-page="itemsPerPage"
    /> -->
  </u-container>
</template>
