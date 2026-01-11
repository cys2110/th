<script setup lang="tsx">
import type { AsyncDataRequestStatus } from "#app"
import { parseDate } from "@internationalized/date"

const props = defineProps<{
  edition?: EditionDetailsType
  status: AsyncDataRequestStatus
  refresh: () => void
}>()

const {
  params: { year }
} = useRoute("edition")
const tournamentStore = useTournamentStore()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const xlAndUp = breakpoints.greaterOrEqual("xl")
const {
  ui: { icons, colors }
} = useAppConfig()

const editionDetails = computed(() => {
  if (props.edition) {
    return [
      ...(props.edition.sponsor_name
        ? [
            {
              label: "Sponsor Name",
              value: <div>{props.edition.sponsor_name}</div>
            }
          ]
        : []),
      ...(props.edition.category
        ? [
            {
              label: "Category",
              value: <div>{props.edition.category}</div>
            }
          ]
        : []),
      ...(props.edition.surface?.id
        ? [
            {
              label: "Surface",
              value: <div>{props.edition.surface.id}</div>
            }
          ]
        : []),
      ...(props.edition.venues.length
        ? [
            {
              label: "Venues",
              value: (
                <div>
                  {props.edition.venues.map(venue => (
                    <div
                      key={venue.id}
                      class="flex flex-wrap items-center gap-1"
                    >
                      <span>{venue.name ? `${venue.name}, ${venue.city}` : venue.city}</span>
                      <country-link
                        country={venue.country}
                        icon-only
                      />
                    </div>
                  ))}
                </div>
              )
            }
          ]
        : []),
      ...(props.edition.currency && props.edition.tfc
        ? [
            {
              label: "Total Financial Commitment",
              value: (
                <div>
                  {props.edition.tfc.toLocaleString("en-GB", {
                    style: "currency",
                    currency: props.edition.currency
                  })}
                </div>
              )
            }
          ]
        : []),
      ...(COUNTRY_DRAWS.includes(tournamentStore.id) && props.edition.events?.[0]?.supervisors.length
        ? [
            {
              label: "Supervisors",
              value: (
                <div>
                  {props.edition.events[0].supervisors.map(supervisor => (
                    <div key={supervisor.id}>{supervisor.id}</div>
                  ))}
                </div>
              )
            }
          ]
        : [])
    ]
  } else {
    return []
  }
})

const getEventDetails = (event: EventType) => {
  return [
    ...(event.sponsor_name
      ? [
          {
            title: "Sponsor Name",
            description: <div>{event.sponsor_name}</div>
          }
        ]
      : []),
    ...(event.category
      ? [
          {
            title: "Category",
            description: <div>{event.category}</div>
          }
        ]
      : []),
    ...(event.surface?.id
      ? [
          {
            title: "Surface",
            description: <div>{event.surface.id}</div>
          }
        ]
      : []),
    ...(event.venues.length
      ? [
          {
            title: "Venues",
            description: (
              <div>
                {event.venues.map(venue => (
                  <div
                    key={venue.id}
                    class="flex flex-wrap items-center gap-1"
                  >
                    <span>{venue.name ? `${venue.name}, ${venue.city}` : venue.city}</span>
                    <country-link
                      country={venue.country}
                      icon-only
                      class="mx-0"
                    />
                  </div>
                ))}
              </div>
            )
          }
        ]
      : []),
    ...(event.pm && event.currency
      ? [
          {
            title: "Prize Money",
            description: (
              <div>
                {event.pm.toLocaleString("en-GB", {
                  style: "currency",
                  currency: event.currency
                })}
              </div>
            )
          }
        ]
      : []),
    ...(event.currency && event.tfc
      ? [
          {
            title: "Total Financial Commitment",
            description: (
              <div>
                {event.tfc.toLocaleString("en-GB", {
                  style: "currency",
                  currency: event.currency
                })}
              </div>
            )
          }
        ]
      : []),
    ...(event.supervisors.length
      ? [
          {
            title: "Supervisors",
            description: (
              <div>
                {event.supervisors.map(supervisor => (
                  <div key={supervisor.id}>{supervisor.id}</div>
                ))}
              </div>
            )
          }
        ]
      : [])
  ]
}
</script>

<template>
  <details-grid v-if="editionDetails.length">
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
      <component :is="detail.value" />
    </div>
  </details-grid>

  <loading-details v-else-if="status === 'pending'" />

  <empty
    v-else
    :message="`No details available for ${tournamentStore.name} ${year}.`"
    :icon="ICONS.calendarOff"
  />

  <div
    v-if="!COUNTRY_DRAWS.includes(tournamentStore.id)"
    class="flex gap-5"
  >
    <dashboard-subpanel
      v-for="event in edition?.events"
      :key="event.id"
      class="min-w-1/2"
    >
      <template #title>
        <div class="flex items-center gap-2">
          <u-badge
            :label="event.tour"
            :color="(event.tour as keyof typeof colors)"
          />

          <u-badge
            :label="event.level"
            :color="event.level"
          />
        </div>
      </template>

      <template #right>
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
      </template>

      <div class="flex gap-3">
        <div v-if="event?.start_date && event?.end_date">
          <u-calendar
            range
            :default-value="{ start: parseDate(event.start_date), end: parseDate(event.end_date) }"
            readonly
            :month-controls="false"
            :year-controls="false"
            :week-starts-on="1"
            :weekday-format="xlAndUp ? 'long' : 'short'"
          />
        </div>

        <div class="flex flex-wrap justify-evenly gap-3 flex-1">
          <u-page-feature
            v-for="detail in getEventDetails(event)"
            :key="detail.title"
            :title="detail.title"
            :ui="{ title: 'text-sm text-muted', description: 'text-sm ml-3 text-default' }"
          >
            <template #description>
              <component :is="detail.description" />
            </template>
          </u-page-feature>
        </div>
      </div>
    </dashboard-subpanel>
  </div>
</template>
