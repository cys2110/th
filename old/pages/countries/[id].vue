<script setup lang="ts">
definePageMeta({ name: "country" })
const {
  params: { id, name }
} = useRoute("country")
const { icons } = useAppConfig()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: 1024 })
const mdAndDown = breakpoints.smallerOrEqual("md")

// API call
const { data: country } = await useFetch<CountryInterface>("/api/countries/overview", {
  query: { id },
  server: false
})

useHead({ title: () => `${country.value?.name || capitalCase(name as string)} | Countries` })
const countryName = useState<string>("country-name", () => capitalCase(name as string))

watch(country, () => {
  if (country.value) countryName.value = country.value.name
})

const toc = [
  { label: "Number Ones", to: "#number-ones", icon: icons.one },
  { label: "Big Titles", to: "#big-titles", icon: icons.tournament },
  { label: "Venues", to: "#venues", icon: icons.venue },
  { label: "Events", to: "#events", icon: icons.event },
  { label: "Players", to: "#players", icon: icons.player }
]
</script>

<template>
  <u-container class="max-w-(--container-7xl)">
    <u-page>
      <template #left>
        <u-page-aside>
          <u-page-anchors :links="toc" />
        </u-page-aside>
      </template>

      <u-page-header
        headline="Countries"
        :ui="{ title: 'flex items-center gap-2' }"
      >
        <template #title>
          <u-icon
            v-if="country"
            :name="getFlagCode(country)"
          />
          {{ country?.name || capitalCase(name as string) }}
        </template>

        <template
          #links
          v-if="mdAndDown"
        >
          <u-dropdown-menu :items="toc">
            <u-button :icon="icons.toc" />
          </u-dropdown-menu>
        </template>
      </u-page-header>

      <u-page-body>
        <u-page-list class="*:my-5">
          <country-number-ones />
          <country-big-titles />
          <country-venues />
          <country-events />
          <country-players />
        </u-page-list>
      </u-page-body>
    </u-page>
  </u-container>
</template>
