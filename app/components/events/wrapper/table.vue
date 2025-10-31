<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui"

const {
  name: routeName,
  params: { id, name, year, edId, tour }
} = useRoute("event")
const {
  ui: { icons }
} = useAppConfig()

const { data: event } = await useFetch<EventInterface>("/api/events/event", {
  key: `${edId}-${tour}`,
  query: { id: `${edId}-${tour}` }
})

useHead({
  title: () =>
    `${EVENT_PAGES.find(page => page.name === routeName)?.label} | ${event.value?.edition.tournament.name ?? capitalCase(name)} ${year} ${tour}`
})

const toc = [
  { label: "Details", to: "#details", icon: ICONS.overview },
  { label: "Awards", to: "#awards", icon: ICONS.awards },
  { label: "Seeds", to: "#seeds", icon: ICONS.seeds },
  { label: "Entry Information", to: "#entry-info", icon: icons.info },
  { label: "Entries", to: "#entries", icon: ICONS.player }
]
</script>

<template>
  <table-wrapper>
    <template #navbar-right>
      <u-dropdown-menu
        v-if="routeName === 'event' && !COUNTRY_DRAWS.includes(id)"
        :items="toc"
      >
        <u-button :icon="ICONS.toc" />
      </u-dropdown-menu>
      <u-button
        :icon="icons.external"
        :to="event?.site_link"
        target="_blank"
      />
      <u-button
        v-if="event?.wiki_link"
        :icon="ICONS.wikipedia"
        :to="event.wiki_link"
        target="_blank"
      />
      <u-dropdown-menu
        :items="EVENT_PAGES.map(page => ({ ...page, to: { name: page.name, params: { year, edId, tour, name, id } } }) as DropdownMenuItem)"
      >
        <u-button :icon="ICONS.layers" />
      </u-dropdown-menu>
    </template>
    <template #toolbar>
      <slot name="toolbar" />
    </template>

    <slot />

    <template
      #footer
      v-if="$slots['footer']"
    >
      <slot name="footer" />
    </template>
  </table-wrapper>
</template>
