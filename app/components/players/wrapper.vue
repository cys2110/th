<script setup lang="ts">
import type { DropdownMenuItem, PageLink } from "@nuxt/ui"

const {
  name: routeName,
  params: { id, name }
} = useRoute("player")
const {
  ui: { icons, colors }
} = useAppConfig()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")

const currentPage = computed(() => PLAYER_PAGES.find(page => page.name === routeName) || null)

const { data: player } = await useFetch("/api/players/overview", {
  query: { id }
})

useHead({
  title: () =>
    `${currentPage.value?.label} | ${player.value?.first_name ? `${player.value.first_name} ${player.value.last_name}` : capitalCase(name)}`
})

// Determine whether player is still active on tour
const activeYears = computed(() => {
  let active = false
  let numberOfYears = 0
  let activeYears = ""
  if (player.value?.years?.length) {
    const lastYear = player.value.years[player.value.years.length - 1]
    active = lastYear === new Date().getFullYear()
    numberOfYears = lastYear! - player.value.years[0]! + 1
    activeYears = `${player.value.years[0]}${
      player.value.years.length > 1 ? ` — ${active ? "present" : player.value.years[player.value.years.length - 1]}` : ""
    }`
  }
  return { active, numberOfYears, activeYears }
})

const otherLinks = computed(() => {
  if (player.value) {
    const playerDetails = player.value
    return [
      { label: "Site Profile", to: player.value.site_link, target: "_blank" },
      playerDetails.official_link && { label: "Official Website", to: playerDetails.official_link, target: "_blank" },
      playerDetails.wiki_link && { label: "Wikipedia", to: playerDetails.wiki_link, target: "_blank" }
    ].filter(Boolean) as DropdownMenuItem[]
  }
  return []
})

const active = computed({
  get() {
    return routeName
  },
  set(tab) {
    navigateTo({ name: tab, params: { name, id } })
  }
})
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <u-tabs
            v-if="!mdAndDown"
            v-model="active"
            :content="false"
            :items="
              PLAYER_PAGES.map(page => ({
                ...page,
                value: page.name,
                to: { name: page.name, params: { name, id } }
              }))
            "
            orientation="vertical"
            variant="link"
          />

          <u-separator />

          <u-badge
            v-if="player?.updated_at"
            class="w-full justify-center"
            :label="`Updated on ${useDateFormat(player.updated_at as string, 'DD MMMM YYYY').value}`"
            color="success"
          />

          <slot
            v-if="player"
            name="page-left"
            :first-name="player.first_name"
            :last-name="player.last_name"
            :country="player.country"
            :tour="player.tour"
          />

          <u-separator />

          <u-page-links :links="(otherLinks as PageLink[])" />
        </u-page-aside>
      </template>

      <template
        #right
        v-if="$slots['page-right']"
      >
        <u-page-aside>
          <slot name="page-right" />
        </u-page-aside>
      </template>

      <u-page-header :title="currentPage?.label">
        <template #headline>
          <breadcrumbs />
        </template>

        <template
          #description
          v-if="player"
        >
          <div
            v-if="player"
            class="flex items-center gap-2 w-fit"
          >
            <countries-link
              v-if="player?.country?.id"
              :country="player?.country"
              icon-only
            />
            <u-badge
              :color="activeYears.active ? 'Active' : 'Inactive'"
              :label="activeYears.active ? 'Active' : 'Inactive'"
            />
            <u-badge
              :color="(player.tour as keyof typeof colors)"
              :label="player.tour"
            />
            <div>
              Years Active: {{ activeYears.activeYears }} ({{ activeYears.numberOfYears }} year{{ activeYears.numberOfYears === 1 ? "" : "s" }})
            </div>
          </div>
        </template>

        <template #links>
          <slot name="header-links" />
          <u-dropdown-menu
            v-if="mdAndDown"
            :items="otherLinks"
          >
            <u-button :icon="icons.external" />
          </u-dropdown-menu>
          <u-dropdown-menu
            v-if="mdAndDown"
            :items="PLAYER_PAGES.map(page => ({ ...page, to: { name: page.name, params: { name, id}}}) as DropdownMenuItem)"
          >
            <u-button :icon="ICONS.layers" />
          </u-dropdown-menu>
        </template>
      </u-page-header>

      <u-page-body>
        <slot
          v-if="player"
          :active-years="activeYears"
          :first-name="player.first_name"
          :last-name="player.last_name"
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
