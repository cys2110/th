<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui"

const {
  ui: { icons }
} = useAppConfig()
const { setViewMode } = useViewMode()
const collapsed = ref(true)

const searchTerm = ref("")

const navLinks: NavigationMenuItem[] = [
  { label: "Results Archive", to: { name: "results-archive" }, icon: ICONS.event },
  { label: "Tournaments", to: { name: "tournaments" }, icon: ICONS.tournament },
  { label: "Players", to: { name: "players" }, icon: ICONS.player },
  { label: "Head to Head", to: { name: "h2h" }, icon: ICONS.h2h },
  { label: "Countries", to: { name: "countries" }, icon: ICONS.countries },
  { label: "Years", to: { name: "years" }, icon: ICONS.year },
  // { label: "Stats/Records", icon: icons.stats, to: { name: "statistics-and-records" } },
  { label: "About", to: { name: "about" }, icon: icons.info }
]

const relatedLinks = [
  {
    label: "Governing Bodies",
    children: [
      { label: "ATP", to: "https://www.atptour.com/", target: "_blank" },
      { label: "WTA", to: "https://www.wtatennis.com/", target: "_blank" },
      { label: "ITF", to: "https://www.itftennis.com/", target: "_blank" }
    ]
  },
  {
    label: "Grand Slams",
    children: [
      { label: "Australian Open", to: "https://www.ausopen.com/", target: "_blank" },
      { label: "Roland Garros", to: "https://www.rolandgarros.com/", target: "_blank" },
      { label: "Wimbledon", to: "https://www.wimbledon.com/", target: "_blank" },
      { label: "US Open", to: "https://www.usopen.org/", target: "_blank" }
    ]
  },
  {
    label: "Other Links",
    children: [
      { label: "About me", to: "https://www.claire-sheridan.com", target: "_blank" },
      { label: "Ranking Rules History", to: "https://openerarankings.com/Home", target: "_blank" },
      { label: "Tennis Abstract", to: "https://www.tennisabstract.com/", target: "_blank" }
    ]
  }
]

const { data: results, status } = await useFetch("/api/search", {
  key: searchTerm,
  query: { searchTerm },
  default: () => [],
  lazy: true,
  server: false,
  transform: (data: any) => {
    const nonNullData = data.filter((item: any) => item.labels)
    return nonNullData.map((item: any) => ({
      id: item.id?.low ?? item.id,
      label: item.name ?? `${item.first_name} ${item.last_name}`,
      to: {
        name: item.labels.includes("Player") ? "player" : item.labels.includes("Country") ? "country" : "tournament",
        params: {
          id: item.id?.low ?? item.id,
          name: kebabCase(item.name ?? `${item.first_name} ${item.last_name}`)
        }
      }
    }))
  }
})

const groups = computed(() => [
  {
    id: "viewMode",
    label: "View mode",
    items: [
      {
        label: "Switch to card view",
        icon: ICONS.cards,
        onSelect: () => {
          setViewMode("cards")
          reloadNuxtApp()
        }
      }
    ]
  },
  {
    id: "results",
    label: searchTerm.value ? `Results matching ${searchTerm.value}` : "Search players, tournaments or countries",
    items: get(results) || []
  }
])
</script>

<template>
  <u-dashboard-group>
    <u-dashboard-search
      v-model:search-term="searchTerm"
      :groups
      :loading="status === 'pending'"
    />

    <u-dashboard-sidebar v-model:collapsed="collapsed">
      <template #header>TH</template>

      <template #default="{ collapsed }">
        <u-dashboard-search-button
          size="sm"
          :collapsed
          :kbds="[]"
          :icon="icons.search"
        />
        <u-navigation-menu
          orientation="vertical"
          :collapsed
          tooltip
          :items="navLinks"
          variant="link"
        />
      </template>

      <template #footer>
        <u-popover
          class="mx-auto"
          :content="{ side: 'right', sideOffset: 15 }"
        >
          <u-button
            label="More"
            variant="ghost"
            color="neutral"
            icon="solar:menu-dots-bold-duotone"
            class="flex-col"
            block
          />

          <template #content>
            <u-navigation-menu
              :items="relatedLinks"
              orientation="vertical"
            />
          </template>
        </u-popover>
      </template>
    </u-dashboard-sidebar>

    <slot />
  </u-dashboard-group>
</template>
