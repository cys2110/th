<script setup lang="ts">
useHead({ title: "Countries" })

const { countries, pending, fetchCountries } = useCountryList()
const viewModeStore = useViewModeStore()

const filters = ref<CountryFiltersInterface>({
  countries: [],
  continents: []
})
</script>

<template>
  <u-container>
    <u-page>
      <u-page-header title="Countries">
        <template
          #description
          v-if="!viewModeStore.isTableView"
        >
          <div class="flex justify-end gap-2">
            <u-select-menu
              v-model="filters.countries"
              value-key="id"
              label-key="name"
              placeholder="Filter by country"
              multiple
              :icon="ICONS.globe"
              :items="countries"
              class="w-fit max-w-1/2"
              clear
            />

            <u-select-menu
              v-model="filters.continents"
              placeholder="Filter by continent"
              multiple
              :icon="ICONS.world"
              :items="[...CONTINENTS]"
              class="w-fit max-w-1/2"
              clear
            />
          </div>
        </template>
      </u-page-header>

      <u-page-body>
        <country-table
          v-if="viewModeStore.isTableView"
          :countries
          :pending
          @refresh="fetchCountries"
        />

        <country-grid
          v-else
          :countries
          :pending
          :filters
          @refresh="fetchCountries"
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
