<script setup lang="ts">
const { countries } = defineProps<{ countries: CountryInterface[]; status: APIStatusType }>()

const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")
const filtered = ref(false)

const selectedLetter = ref<string | undefined>()
const filteredCountries = ref(countries)

watch(selectedLetter, () => {
  set(filteredCountries, [])
  set(filtered, false)
  if (get(selectedLetter)) {
    set(
      filteredCountries,
      countries.filter(country => country.name.startsWith(get(selectedLetter)!))
    )
  } else {
    set(filteredCountries, countries)
  }
})

const toc = ref([
  {
    id: "countries",
    label: "Countries",
    items: countries.map(country => ({
      label: country.name,
      onSelect: () => {
        set(selectedLetter, undefined)
        if (get(filtered)) {
          if (get(filteredCountries).some(c => c.id === country.id)) {
            if (get(filteredCountries).length === 1) {
              set(filtered, false)
              set(filteredCountries, countries) // Reset to all countries
            } else {
              set(
                filteredCountries,
                get(filteredCountries).filter(c => c.id !== country.id)
              )
            }
          } else {
            set(filteredCountries, [...get(filteredCountries), country])
          }
        } else {
          set(filteredCountries, [country])
          set(filtered, true)
        }
      }
    }))
  }
])
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <filter-letters v-model="selectedLetter" />
        </u-page-aside>
      </template>

      <template #right>
        <u-page-aside>
          <div class="font-semibold">{{ filteredCountries.length }} countries</div>
          <u-command-palette
            v-if="filteredCountries.length"
            placeholder="Search countries"
            :groups="toc"
            :loading="status === 'pending'"
            :fuse="{ resultLimit: 1000 }"
            :ui="{ root: 'my-4', content: 'max-h-200 2xl:max-h-175' }"
          />
        </u-page-aside>
      </template>

      <u-page-header title="Countries">
        <template
          #links
          v-if="mdAndDown"
        >
          <u-slideover
            title="Filters"
            class="ml-auto"
          >
            <u-button :icon="ICONS.filter" />

            <template #body>
              <filter-letters v-model="selectedLetter" />
            </template>
          </u-slideover>
        </template>
      </u-page-header>

      <u-page-body>
        <u-page-grid v-if="filteredCountries.length || status === 'pending'">
          <div
            v-if="filteredCountries.length"
            v-for="country in filteredCountries"
            :key="country.id"
            :id="country.id"
          >
            <u-page-card
              highlight
              :to="{ name: 'country', params: { id: country.id, name: kebabCase(country.name) } }"
              :icon="getFlagCode(country)"
              :title="country.name"
              :ui="{ body: 'flex-none', container: 'items-center', wrapper: 'flex-row items-center gap-2 justify-center', leading: 'mb-0' }"
            />
          </div>

          <loading-base
            v-else
            v-for="_ in 6"
            :key="_"
          />
        </u-page-grid>

        <empty-cards
          v-else
          message="No countries found"
          :icon="ICONS.noCountries"
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
