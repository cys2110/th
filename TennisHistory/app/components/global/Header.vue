<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui"

const {
  ui: { icons }
} = useAppConfig()

// Navigation menu items
const navLinks: NavigationMenuItem[] = [
  { label: "Results Archive", icon: ICONS.calendar, to: { name: "results-archive" } },
  { label: "Tournaments", icon: ICONS.trophy, to: { name: "tournaments" } },
  { label: "Players", icon: ICONS.player, to: { name: "players" } },
  { label: "Head to Head", icon: ICONS.h2h, to: { name: "h2h" } },
  { label: "Stats/Records", icon: ICONS.stats, to: { name: "statistics-and-records" } },
  { label: "Countries", icon: ICONS.globe, to: { name: "countries" } },
  { label: "Years", icon: ICONS.years, to: { name: "years" } },
  { label: "About", icon: icons.info, to: { name: "about" } }
]

// Search
// const searchTerm = ref("")
// const { data: results, status } = await useFetch("/api/search", {
//   key: searchTerm,
//   query: { searchTerm },
//   default: () => [] as CommandPaletteGroup[],
//   lazy: true,
//   server: false,
//   transform: (data: any) => {
//     const countries = data.filter((item: any) => item.labels.includes("Country"))
//     const players = data.filter((item: any) => item.labels.includes("Player"))
//     const tournaments = data.filter((item: any) => item.labels.includes("Tournament"))
//     const groups = []
//     if (countries.length) {
//       groups.push({
//         id: "countries",
//         label: "Countries",
//         items: countries.map((item: any) => ({
//           label: item.name,
//           to: {
//             name: "country",
//             params: {
//               id: item.id?.low ?? item.id,
//               name: kebabCase(item.name)
//             }
//           }
//         }))
//       })
//     }

//     if (players.length) {
//       groups.push({
//         id: "players",
//         label: "Players",
//         items: players.map((item: any) => ({
//           label: `${item.first_name} ${item.last_name}`,
//           to: {
//             name: "player",
//             params: {
//               id: item.id,
//               name: kebabCase(`${item.first_name} ${item.last_name}`)
//             }
//           }
//         }))
//       })
//     }

//     if (tournaments.length) {
//       groups.push({
//         id: "tournaments",
//         label: "Tournaments",
//         items: tournaments.map((item: any) => ({
//           label: item.name,
//           to: {
//             name: "tournament",
//             params: {
//               id: item.id?.low,
//               name: kebabCase(item.name)
//             }
//           }
//         }))
//       })
//     }

//     return groups as CommandPaletteGroup[]
//   }
// })
</script>

<template>
  <u-header
    title="Tennis History"
    mode="drawer"
  >
    <template #right>
      <!--Search-->
      <search />
      <!-- <u-modal title="Search players, tournaments and countries">
        <u-button
          :icon="icons.search"
          variant="ghost"
          color="neutral"
        />

        <template #content>
          <u-command-palette
            v-model:search-term="searchTerm"
            :groups="results"
            :loading="status === 'pending'"
          />
        </template>
      </u-modal> -->
      <u-color-mode-button />
    </template>

    <u-navigation-menu
      :items="navLinks"
      highlight
      highlight-color="primary"
    />

    <!-- Need to include body template to show on mobile screens -->
    <template #body>
      <u-navigation-menu
        :items="navLinks"
        highlight
        highlight-color="primary"
        orientation="vertical"
      />
    </template>
  </u-header>
</template>
