<script setup lang="ts">
useHead({ title: "Countries" })

const viewModeStore = useViewModeStore()

const tableRef = useTemplateRef<any>("tableRef")

// Filters
const countries = ref<OptionType[]>([])
const continents = ref<string[]>([])

const resetFilters = () => {
  set(countries, [])
  set(continents, [])
}

const showResetFilters = computed(() => {
  return !!countries.value.length || !!continents.value.length
})

// API call
const { data, status, error } = await useFetch("/api/countries", {
  default: () => []
})

watch(error, newError => {
  if (newError?.statusMessage) {
    console.error(newError.statusMessage, newError.data?.data)
  } else {
    console.error(newError)
  }
})

const countryOptions = computed<OptionType[]>(() =>
  data.value.map(c => ({
    value: c.id,
    label: c.name,
    icon: getFlagCode(c)
  }))
)

const filteredCountries = computed(() =>
  data.value.filter(country => {
    const isCountryMatch = !countries.value.length || countries.value.some(c => c.value === country.id)
    const isContinentMatch = !continents.value.length || continents.value.some(c => c === country.continent)
    return isCountryMatch && isContinentMatch
  })
)

const total = computed(() => {
  if (viewModeStore.isCardView) {
    return filteredCountries.value.length
  } else {
    return tableRef.value?.table?.tableApi.getFilteredRowModel().rows.length ?? 0
  }
})
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <!--Count-->
          <u-badge
            :label="`${total} Countr${total === 1 ? 'y' : 'ies'}`"
            color="success"
            class="w-full font-semibold"
          />

          <!--Filters-->
          <filters
            v-if="viewModeStore.isCardView"
            :show-reset-filters
            @reset-filters="resetFilters"
          >
            <u-input-menu
              v-model="countries"
              placeholder="Select countries"
              multiple
              :icon="ICONS.globe"
              :items="countryOptions"
            />
            <u-input-menu
              v-model="<string[]>continents"
              placeholder="Select continents"
              multiple
              icon="icon-park-twotone:globe"
              :items="CONTINENTS"
            />
          </filters>
        </u-page-aside>
      </template>

      <u-page-header title="Countries">
        <template #links>
          <view-switcher />

          <u-slideover
            v-if="viewModeStore.isCardView"
            title="Filters"
            class="lg:hidden"
          >
            <u-button :icon="ICONS.filter" />

            <template #body>
              <filters
                :show-reset-filters
                @reset-filters="resetFilters"
              >
                <u-input-menu
                  v-model="countries"
                  placeholder="Select countries"
                  multiple
                  :icon="ICONS.globe"
                  :items="countryOptions"
                />

                <u-input-menu
                  v-model="<string[]>continents"
                  placeholder="Select continents"
                  multiple
                  icon="icon-park-twotone:globe"
                  :items="CONTINENTS"
                />
              </filters>
            </template>
          </u-slideover>
        </template>
      </u-page-header>

      <u-page-body>
        <!--Show error messages on dev-->
        <dev-only v-if="error">
          <u-alert
            :title="error.statusMessage || 'Error fetching countries'"
            color="error"
          >
            <template #description>
              <div
                v-for="(item, index) in error.data?.data"
                :key="index"
              >
                {{ item }}
              </div>
            </template>
          </u-alert>
        </dev-only>

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
          :countries="data"
          :status
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
