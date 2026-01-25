<script setup lang="ts">
useHead({ title: "Countries" })

const { devMode } = useRuntimeConfig().public

const viewModeStore = useViewModeStore()

const tableRef = useTemplateRef("tableRef")

// Filters
const countries = ref<string[]>([])
const continents = ref<string[]>([])

const resetFilters = () => {
  if (tableRef.value?.table) {
    tableRef.value.table.tableApi.resetColumnFilters()
  } else {
    set(countries, [])
    set(continents, [])
  }
}

const showResetFilters = computed<boolean>(() : boolean =>
  !!countries.value?.length || !!continents.value?.length || !!tableRef.value?.table?.tableApi.getState().columnFilters.length
)

// API call
const { data, status, refresh, error } = await useFetch("/api/countries", {
  default: () => ({ results: [] as CountryType[], statusObjects: [] })
})

watch(
  () => data.value.statusObjects,
  () => {
    if (data.value?.statusObjects.length && devMode) {
      console.info("Countries API Status Objects:", data.value.statusObjects)
    }
  },
  { immediate: true }
)

watch(
  error,
  newError => {
    if (newError) {
      if (newError.statusMessage) {
        console.error(newError.statusMessage, newError.data?.data)
      } else {
        console.error(newError)
      }
    }
  },
  { immediate: true }
)

const countryOptions = computed<OptionType[]>(() =>
  data.value.results.map(c => ({
    value: c.id,
    label: c.name,
    icon: getFlagCode(c)
  }))
)

const filteredCountries = computed(() =>
  data.value.results.filter(country => {
    const isCountryMatch = !countries.value?.length || countries.value.some(c => c === country.id)
    const isContinentMatch = !continents.value?.length || continents.value.some(c => c === country.continent)
    return isCountryMatch && isContinentMatch
  })
)
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <dev-only>
            <country-create @refresh="refresh" />

            <u-separator />
          </dev-only>

          <!--Filters-->
          <filters
            :show-reset-filters
            @reset-filters="resetFilters"
          >
            <u-input-menu
              v-model="countries"
              value-key="value"
              placeholder="Select countries"
              multiple
              :icon="ICONS.globe"
              :items="countryOptions"
            />

            <u-input-menu
              v-model="<ContinentEnumType[]>continents"
              placeholder="Select continents"
              multiple
              :icon="ICONS.world"
              :items="CONTINENTS"
            />
          </filters>
        </u-page-aside>
      </template>

      <u-page-header title="Countries">
        <template #links>
          <view-switcher />

          <!-- Filters for smaller screens -->
          <u-slideover
            v-if="viewModeStore.isCardView"
            title="Filters"
            class="lg:hidden"
          >
            <u-button :icon="ICONS.filter" />

            <template #body>
              <filters
                v-if="viewModeStore.isCardView"
                :show-reset-filters
                @reset-filters="resetFilters"
              >
                <u-input-menu
                  v-model="countries"
                  value-key="value"
                  placeholder="Select countries"
                  multiple
                  :icon="ICONS.globe"
                  :items="countryOptions"
                />

                <u-input-menu
                  v-model="<ContinentEnumType[]>continents"
                  placeholder="Select continents"
                  multiple
                  :icon="ICONS.world"
                  :items="CONTINENTS"
                />
              </filters>
            </template>
          </u-slideover>
        </template>
      </u-page-header>

      <u-page-body>
        <!--Dev alerts-->
        <api-alerts :error />

        <!--Card view-->
        <countries-grid
          v-if="viewModeStore.isCardView"
          :countries="filteredCountries"
          :status
        />

        <!--Table view-->
        <countries-table
          v-else
          ref="tableRef"
          :countries="data.results"
          :status
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
