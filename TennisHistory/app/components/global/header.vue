<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui"

const route = useRoute()
const router = useRouter()

const {
  ui: { icons }
} = useAppConfig()

const supabase = useSupabaseClient()

const viewModeStore = useViewModeStore()
const { isLoggedIn } = useAuthState()

// Navigation menu items
const navLinks = computed<Array<NavigationMenuItem>>(() => [
  {
    label: "Results",
    icon: ICONS.years,
    active: route.name === "results-archive",
    to: { name: "results-archive" }
  },
  {
    label: "Tournaments",
    icon: ICONS.trophy,
    to: { name: "tournaments" },
    active: route.path.startsWith("/tournaments")
  },
  {
    label: "Players",
    icon: ICONS.racquet,
    active: route.path.startsWith("/players") || route.path.startsWith("/h2h"),
    defaultOpen: true,
    to: { name: "players" },
    children: [
      { label: "All Players", icon: ICONS.player, to: { name: "players" } },
      { label: "Head to Head", icon: ICONS.h2h, to: { name: "h2h" } }
    ]
  },
  {
    label: "More",
    icon: icons.ellipsis,
    defaultOpen: true,
    children: [
      { label: "Countries", icon: ICONS.globe, to: { name: "countries" } },
      { label: "Years", icon: ICONS.years, to: { name: "years" } },
      { label: "About", icon: icons.info, to: { name: "about" } }
    ]
  }
])

const showViewSwitcher = computed(() => {
  const currentRouteName = route.name
  const viewSwitcherRoutes = ["tournaments", "tournament", "results", "players", "countries"]
  return viewSwitcherRoutes.includes(currentRouteName)
})

const handleAuthState = async () => {
  if (isLoggedIn.value) {
    await supabase.auth.signOut()
  } else {
    router.push({ name: "signin" })
  }
}
</script>

<template>
  <u-header
    title="TennisHistory"
    mode="drawer"
  >
    <template #right>
      <search />

      <u-button
        v-if="showViewSwitcher"
        variant="ghost"
        :icon="viewModeStore.isTableView ? ICONS.table : ICONS.cards"
        @click="viewModeStore.toggleViewMode"
        color="neutral"
      />

      <u-button
        :icon="isLoggedIn ? 'solar:logout-2-line-duotone' : 'solar:login-2-line-duotone'"
        @click="handleAuthState"
        color="neutral"
        variant="ghost"
      />

      <u-color-mode-button />
    </template>

    <u-navigation-menu
      :items="navLinks"
      color="primary"
      highlight
      highlight-color="primary"
      content-orientation="vertical"
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
