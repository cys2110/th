<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui"

const {
  name: routeName,
  params: { tour, edId, name, year, id }
} = useRoute("event")
const {
  ui: { icons, colors }
} = useAppConfig()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")

const currentPage = computed(() => EVENT_PAGES.find(page => page.name === routeName))

const { data: event } = await useFetch("/api/events/event", {
  key: `${edId}-${tour}`,
  query: { edId, tour }
})

useHead({
  title: () => `${currentPage.value?.label} | ${event.value?.edition?.tournament?.name ?? capitalCase(name)} ${year} ${tour}`
})

const active = computed({
  get() {
    return routeName
  },
  set(tab) {
    navigateTo({ name: tab, params: { name, id, year, edId, tour } })
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
              EVENT_PAGES.map(page => ({
                ...page,
                value: page.name,
                to: { name: page.name, params: { name, id, year, edId, tour } }
              }))
            "
            orientation="vertical"
            variant="link"
          />

          <u-badge
            color="success"
            :label="`Updated: ${useDateFormat(event?.updated_at, 'DD MMMM YYYY').value}`"
            class="w-full justify-center"
          />

          <slot name="page-left" />
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

        <template #description>
          <div
            v-if="event"
            class="flex items-center gap-2"
          >
            <u-badge
              :label="event?.tour"
              :color="(event?.tour as keyof typeof colors)"
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

            <u-button
              :icon="icons.external"
              :to="event?.site_link"
              target="_blank"
            />

            <u-button
              v-if="event?.wiki_link || event?.edition?.wiki_link"
              :href="event.wiki_link || event.edition?.wiki_link"
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
