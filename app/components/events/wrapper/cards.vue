<script setup lang="ts">
import type { BreadcrumbItem, DropdownMenuItem, PageLink } from "@nuxt/ui"

const {
  name: routeName,
  params: { id, tour, year, edId, name }
} = useRoute("event")
const {
  ui: { icons }
} = useAppConfig()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")

const { data: event } = await useFetch<EventInterface>("/api/events/event", {
  key: `${edId}-${tour}`,
  query: { id: `${edId}-${tour}` }
})

const currentPage = computed(() => EVENT_PAGES.find(page => page.name === routeName))

useHead({
  title: () => `${currentPage.value?.label} | ${event.value?.edition.tournament.name ?? capitalCase(name)} ${year} ${tour}`
})

const toc = [
  { label: "Details", to: "#details", icon: ICONS.overview },
  { label: "Awards", to: "#awards", icon: ICONS.awards },
  { label: "Seeds", to: "#seeds", icon: ICONS.seeds },
  { label: "Entry Information", to: "#entry-info", icon: icons.info },
  { label: "Entries", to: "#entries", icon: ICONS.player }
]

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { icon: ICONS.home, to: { name: "home" } },
  { label: "Tournaments", to: { name: "tournaments" }, icon: ICONS.tournament },
  { label: event.value?.edition.tournament.name ?? capitalCase(name), to: { name: "tournament", params: { id, name } } },
  { label: year, to: { name: "edition", params: { id, name, year, edId } } }
])
</script>

<template>
  <u-container :class="{ 'max-w-(--ui-container-7xl)': !$slots['page-right'] }">
    <u-page>
      <template #left>
        <u-page-aside>
          <template v-if="event && routeName === 'event'">
            <dev-only>
              <events-update
                v-if="event"
                :event
              />
              <events-scrape-draw v-if="['ATP', 'WTA'].includes(tour)" />
              <events-scrape-results v-if="tour === 'ATP'" />
              <events-scrape-stats v-if="['ATP', 'WTA'].includes(tour)" />
            </dev-only>
            <u-badge
              color="success"
              :label="`Updated: ${useDateFormat(event.updated_at, 'DD MMMM YYYY').value}`"
              class="w-full justify-center"
            />
          </template>

          <u-page-links
            :links="(EVENT_PAGES.map(page => ({ label: page.label, to: { name: page.name, params: { name, id, year, edId } }, icon: page.icon, ui: { linkLeadingIcon: page.name === 'draws' ? 'rotate-270' : undefined} })) as PageLink[])"
          />

          <slot name="page-left" />
        </u-page-aside>
      </template>

      <template
        #right
        v-if="routeName === 'event' || $slots['page-right']"
      >
        <u-page-aside>
          <u-page-links
            v-if="routeName === 'event' && !COUNTRY_DRAWS.includes(id)"
            :links="toc"
          />
          <slot name="page-right" />
        </u-page-aside>
      </template>

      <u-page-header :title="currentPage?.label">
        <template #headline>
          <u-breadcrumb :items="breadcrumbs" />
        </template>

        <template #description>
          <div
            v-if="event"
            class="flex items-center gap-2"
          >
            <u-badge
              :label="TourEnum[event.tour]"
              :color="event?.tour"
            />
            <u-badge
              :label="event?.level"
              :color="event?.level"
            />
          </div>
        </template>

        <template #links>
          <div
            v-if="event"
            class="flex items-center gap-2"
          >
            <slot name="header-links" />
            <u-dropdown-menu
              v-if="routeName === 'event' && !COUNTRY_DRAWS.includes(id) && mdAndDown"
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
              :href="event.wiki_link"
              :icon="ICONS.wikipedia"
              target="_blank"
            />
            <u-dropdown-menu
              v-if="mdAndDown"
              :items="EVENT_PAGES.map(page => ({ ...page, to: { name: page.name, params: { year, edId, tour, name, id } } }) as DropdownMenuItem)"
            >
              <u-button :icon="ICONS.layers" />
            </u-dropdown-menu>
          </div>
        </template>
      </u-page-header>

      <u-page-body>
        <slot />
      </u-page-body>
    </u-page>
  </u-container>
</template>
