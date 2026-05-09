<script setup lang="ts">
useHead({ title: "Countries" })

const supabase = useSupabaseClient()

const viewModeStore = useViewModeStore()

const {
  data: countries,
  pending,
  refresh
} = await useAsyncData(
  "countries",
  async () => {
    const { data, error } = await supabase.from("countries").select("*").order("name", { ascending: true })

    if (error || !data) {
      console.error("Error fetching countries:", error)
      return []
    }

    return data
  },
  { default: () => [] }
)

const filters = ref<CountryFiltersInterface>({
  countries: [],
  continents: []
})
</script>

<template>
  <u-container class="xl:max-w-7xl">
    <u-page>
      <u-page-header title="Countries">
        <template #links>
          <dev-only>
            <country-create @refresh="refresh" />
          </dev-only>
        </template>

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
        <countries-table
          v-if="viewModeStore.isTableView"
          :countries
          :pending
        />

        <countries-grid
          v-else
          :countries
          :pending
          :filters
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
