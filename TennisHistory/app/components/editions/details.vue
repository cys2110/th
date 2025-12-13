<script setup lang="ts">
import { parseDate } from "@internationalized/date"

const { edition } = defineProps<{
  edition?: EditionDetailsType
  status: "idle" | "pending" | "error" | "success"
}>()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const xlAndUp = breakpoints.greaterOrEqual("xl")
const {
  ui: { icons }
} = useAppConfig()

const editionDetails = computed(() => {
  if (edition) {
    return [
      edition.sponsor_name && {
        label: "Sponsor Name",
        value: edition.sponsor_name
      },
      edition.category && {
        label: "Category",
        value: edition.category
      },
      edition.surface?.id && {
        label: "Surface",
        value: edition.surface.id
      },
      edition.venues.length && {
        label: "Venues"
      },
      edition.currency &&
        edition.tfc && {
          label: "Total Financial Commitment",
          value: edition.tfc.toLocaleString("en-GB", {
            style: "currency",
            currency: edition.currency
          })
        }
    ].filter(Boolean) as { label: string; value?: string }[]
  } else {
    return []
  }
})

const getEventDetails = (event: EventType) => {
  return [
    event.sponsor_name && {
      title: "Sponsor Name",
      description: event.sponsor_name
    },
    event.category && {
      title: "Category",
      description: event.category
    },
    event.surface?.id && {
      title: "Surface",
      description: event.surface.id
    },
    event.venues.length && {
      title: "Venues"
    },
    event.pm &&
      event.currency && {
        title: "Prize Money",
        description: event.pm.toLocaleString("en-GB", {
          style: "currency",
          currency: event.currency
        })
      },
    event.currency &&
      event.tfc && {
        title: "Total Financial Commitment",
        description: event.tfc.toLocaleString("en-GB", {
          style: "currency",
          currency: event.currency
        })
      },
    event.supervisors.length && {
      title: "Supervisors"
    }
  ].filter(Boolean) as { title: string; description?: string }[]
}
</script>

<template>
  <div>
    <client-only>
      <details-grid v-if="editionDetails.length || status === 'pending'">
        <div v-if="edition?.start_date && edition?.end_date">
          <u-calendar
            range
            :default-value="{ start: parseDate(edition.start_date), end: parseDate(edition.end_date) }"
            readonly
            :month-controls="false"
            :year-controls="false"
            :week-starts-on="1"
            :weekday-format="xlAndUp ? 'long' : 'short'"
          />
        </div>
        <div
          v-for="detail in editionDetails"
          :key="detail.label"
        >
          <div>{{ detail.label }}</div>
          <div v-if="detail.value">{{ detail.value }}</div>
          <div
            v-else-if="detail.label === 'Venues'"
            v-for="venue in edition?.venues"
            :key="venue.id"
            class="flex flex-wrap items-center gap-1"
          >
            <span>{{ venue.name ? `${venue.name}, ${venue.city}` : venue.city }}</span>
            <countries-link
              :country="venue.country"
              icon-only
              class="mx-0"
            />
          </div>
        </div>
        <loading-base
          v-if="status === 'pending'"
          v-for="_ in 3"
          :key="_"
        />
      </details-grid>
      <empty
        v-else
        message="No data available"
        :icon="ICONS.noEdition"
      />
    </client-only>

    <div class="flex gap-5">
      <dashboard-subpanel
        v-for="event in edition?.events"
        :key="event.id"
        class="min-w-1/2"
      >
        <template #title>
          <div class="flex items-center gap-2">
            <u-badge
              :label="event.tour"
              :color="event.tour"
            />

            <u-badge
              :label="event.level"
              :color="event.level"
            />
          </div>
        </template>

        <template #right>
          <dev-only>
            <events-scrape-draw
              v-if="['ATP', 'WTA'].includes(event.tour)"
              :tour="event.tour"
            />
            <events-scrape-results v-if="event.tour === 'ATP'" />
            <events-scrape-stats
              v-if="['ATP', 'WTA'].includes(event.tour)"
              :tour="event.tour"
            />
          </dev-only>
          <u-button
            v-if="event?.site_link"
            :href="event.site_link"
            :icon="icons.external"
            target="_blank"
          />
          <u-button
            v-if="event?.wiki_link"
            :href="event.wiki_link"
            :icon="ICONS.wikipedia"
            target="_blank"
          />
        </template>

        <div class="flex flex-wrap justify-evenly gap-3">
          <u-page-feature
            v-for="detail in getEventDetails(event)"
            :key="detail.title"
            :title="detail.title"
            :ui="{ title: 'text-sm text-muted', description: 'text-sm ml-3 text-default' }"
          >
            <template #description>
              <template v-if="detail.description">
                {{ detail.description }}
              </template>

              <div
                v-else-if="detail.title === 'Venues'"
                v-for="venue in event.venues"
                :key="venue.id"
                class="flex flex-wrap items-center gap-1"
              >
                <span>{{ venue.name ? `${venue.name}, ${venue.city}` : venue.city }}</span>
                <countries-link
                  :country="venue.country"
                  icon-only
                  class="mx-0"
                />
              </div>

              <div
                v-else-if="detail.title === 'Supervisors'"
                v-for="supervisor in event.supervisors"
                :key="supervisor.id"
              >
                {{ supervisor.id }}
              </div>
            </template>
          </u-page-feature>
        </div>
      </dashboard-subpanel>
    </div>
  </div>
</template>
