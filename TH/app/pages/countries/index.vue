<script setup lang="ts">
/** Countries page */

import type { TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues, getGroupedRowModel } from "@tanstack/vue-table"
import type { Table } from "@tanstack/vue-table"

useHead({ title: "Countries" })

const router = useRouter()
const viewMode = useViewModeStore()
const [defineEmptyTemplate, reuseEmptyTemplate] = createReusableTemplate()
const table = useTemplateRef<{ tableApi: Table<CountryType> }>("table")

const countriesFilter = ref<string[]>([])
const continentsFilter = ref<string[]>([])

const { data: countries, status } = await useFetch("/api/countries", {
  default: () => []
})

const uniqueContinents = computed(() => useArrayUnique(countries.value.map(c => c.continent)).value.sort())
const uniqueCountries = computed(() =>
  useArrayUnique(
    countries.value.map(
      c => ({
        label: c.name,
        icon: getFlagCode(c)
      }),
      (a: any, b: any) => a.label === b.label
    )
  ).value.sort((a, b) => a.label.localeCompare(b.label))
)

const filteredCountries = computed(() => {
  const countryMatches = countries.value.filter(country => {
    if (countriesFilter.value.length === 0) return true
    return countriesFilter.value.includes(country.name)
  })

  const continentMatches = countryMatches.filter(country => {
    if (continentsFilter.value.length === 0) return true
    return continentsFilter.value.includes(country.continent)
  })

  return continentMatches
})

const handleSelectRow = (e: Event, row: TableRow<CountryType>) => {
  if (row.getIsGrouped()) {
    row.toggleExpanded()
  } else {
    router.push({
      name: "country",
      params: {
        id: row.original.id,
        name: kebabCase(row.original.name)
      }
    })
  }
}
</script>

<template>
  <u-container class="min-h-screen flex flex-col">
    <u-page class="flex-1">
      <template #left>
        <u-page-aside>
          <!--Card global resets-->
          <template v-if="viewMode.isCardView">
            <u-form-field label="Filter by">
              <div class="*:my-2">
                <u-input-menu
                  v-model="countriesFilter"
                  value-key="label"
                  placeholder="Select countries"
                  multiple
                  :icon="ICONS.globe"
                  :items="uniqueCountries"
                />

                <u-input-menu
                  v-model="continentsFilter"
                  placeholder="Select continents"
                  multiple
                  icon="icon-park-twotone:globe"
                  :items="uniqueContinents"
                />
              </div>
            </u-form-field>
          </template>

          <!--Table global resets-->
          <template v-else>
            <table-client-clear-filters
              v-if="table"
              :table="table"
            />

            <table-client-clear-sorting
              v-if="table"
              :table="table"
            />

            <table-client-clear-grouping
              v-if="table"
              :table="table"
            />
          </template>
        </u-page-aside>
      </template>

      <u-page-header title="Countries">
        <template #links>
          <view-switcher class="hidden md:block" />
        </template>
      </u-page-header>

      <u-page-body>
        <!--Empty template-->
        <define-empty-template>
          <empty
            message="No countries found"
            :icon="ICONS.globeOff"
          />
        </define-empty-template>

        <!--Card view-->
        <template v-if="viewMode.isCardView">
          <u-page-grid v-if="filteredCountries.length || status === 'pending'">
            <countries-card
              v-if="filteredCountries.length"
              v-for="country in filteredCountries"
              :key="country.id"
              :country="country"
            />

            <loading-card
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
          :data="countries"
          :columns="countriesColumns"
          :loading="status === 'pending'"
          sticky
          @select="handleSelectRow"
          :faceted-options="{
            getFacetedRowModel: getFacetedRowModel(),
            getFacetedUniqueValues: getFacetedUniqueValues()
          }"
          :grouping-options="{
            getGroupedRowModel: getGroupedRowModel()
          }"
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

    <div class="sticky w-full z-50 bg-default bottom-0 mt-auto pt-3 pb-6 *:font-bold *:text-muted">
      <div v-if="viewMode.isCardView"> {{ filteredCountries.length }} {{ filteredCountries.length === 1 ? "country" : "countries" }} </div>
      <div v-else>
        {{ table?.tableApi.getFilteredRowModel().rows.length }}
        {{ table?.tableApi.getFilteredRowModel().rows.length === 1 ? "country" : "countries" }}
      </div>
    </div>
  </u-container>
</template>
