<script setup lang="ts">
useHead({ title: "Countries" })

const route = useRoute("countries")

const { countries, pending, fetchCountries } = useCountryList()
const viewModeStore = useViewModeStore()
const updateRouteQuery = useRouteQueryUpdater()
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
              :model-value="<Array<ContinentType>>route.query.continent"
              @update:model-value="updateRouteQuery('continent', $event)"
              placeholder="Filter by continent"
              multiple
              :icon="ICONS.world"
              :items="[...CONTINENTS]"
              clear
              highlight
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
          @refresh="fetchCountries"
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
