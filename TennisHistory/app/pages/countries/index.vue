<script setup lang="ts">
useHead({ title: "Countries" })

const viewModeStore = useViewModeStore()
const tableRef = useTemplateRef("tableRef")

const countriesFilter = ref<string[]>([])
const continentsFilter = ref<string[]>([])

const {
  data: countries,
  status,
  error
} = await useFetch("/api/countries", {
  default: () => []
})

watch(
  error,
  () => {
    if (error.value) {
      if (error.value.statusMessage === "Validation errors") {
        console.error(error.value.statusMessage, error.value.data?.data.validationErrors)
      } else {
        console.error(error.value)
      }
    }
  },
  { immediate: true }
)

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

  const continentMatches = countries.value.filter(country => {
    if (continentsFilter.value.length === 0) return true
    return continentsFilter.value.includes(country.continent)
  })

  return continentMatches && countryMatches
})
</script>

<template>
  <u-container class="min-h-screen flex flex-col">
    <u-page class="flex-1">
      <template #left>
        <u-page-aside>
          <!--Card global resets-->
          <template v-if="viewModeStore.isCardView">
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
          <template v-else-if="tableRef?.table">
            <table-client-clear-filters :table="tableRef.table" />

            <table-client-clear-sorting :table="tableRef.table" />

            <table-client-clear-grouping :table="tableRef.table" />
          </template>
        </u-page-aside>
      </template>

      <u-page-header title="Countries">
        <template #links>
          <view-switcher />
        </template>
      </u-page-header>

      <u-page-body>
        <!--Card view-->
        <countries-grid
          v-if="viewModeStore.isCardView"
          :countries="filteredCountries"
          :status="status"
        />

        <!--Table view-->
        <countries-table
          v-else
          ref="tableRef"
          :countries
          :status
        />
      </u-page-body>
    </u-page>

    <!--Counts-->
    <div class="sticky w-full z-50 bg-default bottom-0 mt-auto pt-3 pb-6 *:font-bold *:text-muted">
      <div v-if="viewModeStore.isCardView"> {{ filteredCountries.length }} {{ filteredCountries.length === 1 ? "country" : "countries" }} </div>
      <div v-else>
        {{ tableRef?.table.tableApi.getFilteredRowModel().rows.length }}
        {{ tableRef?.table.tableApi.getFilteredRowModel().rows.length === 1 ? "country" : "countries" }}
      </div>
    </div>
  </u-container>
</template>
