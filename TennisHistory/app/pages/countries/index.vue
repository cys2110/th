<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"

useHead({ title: "Countries" })
const router = useRouter()

// Pagination / view
const viewMode = ref(true)
const page = useRouteQuery("page", 1, { transform: Number })
const itemsPerPage = ref(40)
const skip = computed(() => (page.value - 1) * itemsPerPage.value)

const [defineEmptyTemplate, reuseEmptyTemplate] = createReusableTemplate()

const continents = ref<string[]>([])
const countries = ref([])
const resetFilters = () => {
  continents.value = []
  countries.value = []
}

const sortField = ref<SortFieldType[]>([])
const sortFields = [
  { label: "Name", value: "name" },
  { label: "Continent", value: "continent" }
]

const resetSorting = () => set(sortField, [])

watchDeep([continents, countries, itemsPerPage, sortField], () => set(page, 1), { immediate: true })

// const { data, status } = await useFetch("/api/countries", {
//   method: "POST",
//   body: { skip, countries, continents, offset: itemsPerPage, sortField },
//   default: () => ({ count: 0, countries: [] })
// })

// // Table columns setup
// const table = useTemplateRef<any>("table")

// const handleSelectRow = (e: Event, row: TableRow<CountryType>) => {
//   router.push({ name: "country", params: { id: row.original.id, name: kebabCase(row.original.name) } })
// }
</script>

<template>
  <u-container class="min-h-screen flex flex-col">
    <!-- <u-page class="flex-1">
      <template #left>
        <u-page-aside>
          <filters
            :filters="['continents']"
            :reset-filters
            :reset-sorting
            :sort-fields="sortFields"
            v-model:continents="continents"
            v-model:sorting="sortField"
            :table
          />
        </u-page-aside>
      </template>

      <template #right>
        <u-page-aside>
          <form-command-palette-search
            type="Country"
            v-model="countries"
            placeholder="Countries"
            :icon="ICONS.countries"
          />
        </u-page-aside>
      </template>

      <u-page-header title="Countries">
        <template #links>
          <view-switcher v-model="viewMode" />-->

    <!--Filters for smaller screens-->
    <!--<u-slideover
            title="Filters"
            class="ml-auto lg:hidden"
          >
            <u-button :icon="ICONS.filter" />

            <template #body>
              <filters
                :filters="['continents', 'countries']"
                :reset-filters
                :reset-sorting
                :sort-fields="sortFields"
                v-model:countries="countries"
                v-model:continents="continents"
                v-model:sorting="sortField"
              />
            </template>
          </u-slideover>
        </template>
      </u-page-header>

      <u-page-body>-->
    <!--Empty template-->
    <!--<define-empty-template>
          <empty
            message="No countries found"
            :icon="ICONS.noCountries"
            class="mx-2"
          />
        </define-empty-template>-->

    <!--Card view-->
    <!-- <template v-if="viewMode">
          <u-page-grid v-if="data.count || status === 'pending'">
            <countries-card
              v-if="data.countries.length"
              v-for="country in data.countries"
              :key="country.id"
              :country
            />

            <loading-tournament
              v-else
              v-for="_ in 6"
              :key="_"
            />
          </u-page-grid>
          <reuse-empty-template v-else />
        </template> -->

    <!--Table view-->
    <!--<u-table
          v-else
          ref="table"
          :data="data.countries"
          :columns="countryColumns"
          :loading="status === 'pending'"
          sticky
          @select="handleSelectRow"
          :ui="{ root: 'max-h-150 max-w-2/3 mx-auto', tbody: '[&>tr]:cursor-pointer' }"
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
      :placeholder="data.count === 1 ? 'country' : 'countries'"
      v-model:page="page"
      v-model:items-per-page="itemsPerPage"
    /> -->
  </u-container>
</template>
