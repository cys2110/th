<script setup lang="ts">
import { UIcon } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"

useHead({ title: "Countries" })

const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")
const {
  ui: { icons }
} = useAppConfig()

// Pagination / view
const viewMode = ref(true)
const page = ref(1)
const itemsPerPage = ref(40)
const skip = computed(() => (page.value - 1) * itemsPerPage.value)

const continents = ref<string[]>([])
const countries = ref([])

const sortField = ref<SortFieldType>([{ field: "name", direction: "ASC" }])
const sortFields = [
  { label: "Name", value: "name" },
  { label: "Continent", value: "continent" }
]

const resetFilters = () => {
  continents.value = []
  countries.value = []
}

const resetSorting = () => {
  sortField.value = [{ field: "name", direction: "ASC" }]
}

watchDeep([continents, countries, itemsPerPage, sortField], () => set(page, 1), { immediate: true })

const { data, status } = await useFetch("/api/countries", {
  method: "POST",
  body: { skip, countries, continents, offset: itemsPerPage, sortField },
  default: () => ({ count: 0, countries: [] })
})

const [defineEmptyTemplate, reuseEmptyTemplate] = createReusableTemplate()

// Table columns setup
const table = useTemplateRef<any>("table")
const columns: TableColumn<CountryType>[] = [
  { accessorKey: "id", header: "", cell: ({ row }) => h(UIcon, { name: getFlagCode(row.original), class: "size-5" }) },
  { accessorKey: "name", header: "Country" },
  { accessorKey: "continent", header: "Continent" }
]

const handleSelectRow = async (e: Event, row: TableRow<CountryType>) => {
  await navigateTo({ name: "country", params: { id: row.original.id, name: kebabCase(row.original.name) } })
}
</script>

<template>
  <u-container class="min-h-screen">
    <u-page>
      <template #left>
        <u-page-aside>
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
            legend="Continents"
            v-model="continents"
            :items="['Africa', 'Asia', 'Europe', 'North America', 'Oceania', 'South America']"
            :ui="{ item: 'ml-3' }"
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
            type="Country"
            v-model="countries"
            placeholder="Countries"
            :icon="ICONS.countries"
            multiple
          />
        </u-page-aside>
      </template>

      <u-page-header title="Countries">
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
                type="Country"
                v-model="countries"
                :icon="ICONS.countries"
                placeholder="countries"
                multiple
              />

              <u-checkbox-group
                legend="Continents"
                v-model="continents"
                :items="['Africa', 'Asia', 'Europe', 'North America', 'Oceania', 'South America']"
                :ui="{ item: 'ml-3' }"
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
            message="No countries found"
            :icon="ICONS.noCountries"
            class="mx-2"
          />
        </define-empty-template>

        <div class="flex-1">
          <!--Card view-->
          <template v-if="viewMode">
            <u-page-grid v-if="data.count || status === 'pending'">
              <u-page-card
                v-if="data.countries.length"
                v-for="country in data.countries"
                :key="country.id"
                highlight
                :title="country.name"
                :icon="getFlagCode(country)"
                :description="country.continent"
                :to="{ name: 'country', params: { id: country.id, name: kebabCase(country.name) } }"
              />
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
            :data="data.countries"
            :columns
            :loading="status === 'pending'"
            sticky
            @select="handleSelectRow"
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
              {{ data.count }} {{ data.count === 1 ? "country" : "countries" }}
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
