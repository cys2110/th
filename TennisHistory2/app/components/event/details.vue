<script setup lang="ts">
import { parseDate } from "@internationalized/date"

const props = defineProps<{
  event: EventInterface
  showSurfaces: boolean
  showVenues: boolean
}>()

const {
  ui: { icons, colors }
} = useAppConfig()

const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const xlAndUp = breakpoints.greaterOrEqual("xl")
</script>

<template>
  <dashboard-subpanel class="min-w-full xl:min-w-1/2">
    <template #title>
      <div class="flex items-center gap-2">
        <u-badge
          v-if="event.tour"
          :label="event.tour"
          :color="<keyof typeof colors>event.tour"
        />

        <u-badge
          v-if="event.level"
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
        <event-scrape-draw
          v-if="event.tour && ['ATP', 'WTA'].includes(event.tour)"
          :tour="event.tour"
          :event_id="event.id"
        />

        <event-scrape-results
          v-if="event.tour === 'ATP'"
          :event_id="event.id"
        />

        <event-scrape-stats
          v-if="event.tour && ['ATP', 'WTA'].includes(event.tour)"
          :tour="event.tour"
          :event_id="event.id"
        />
      </dev-only>
    </template>

    <u-calendar
      v-if="event?.start_date && event?.end_date"
      range
      :default-value="{ start: parseDate(event.start_date), end: parseDate(event.end_date) }"
      readonly
      :month-controls="false"
      :year-controls="false"
      :week-starts-on="1"
      :weekday-format="xlAndUp ? 'long' : 'short'"
      class="max-w-fit mx-auto"
    />

    <div
      class="flex-1 divide-y divide-default text-sm rounded-md overflow-hidden *:grid *:grid-cols-2 *:*:odd:bg-elevated *:*:odd:dark:bg-muted/50 *:*:px-4 *:*:py-1 *:*:even:font-medium *:*:even:text-muted"
    >
      <div v-if="event.sponsor_name">
        <div>Sponsor Name</div>
        <div>{{ event.sponsor_name }}</div>
      </div>

      <div v-if="event.category">
        <div>Category</div>
        <div>{{ event.category }}</div>
      </div>

      <div v-if="showSurfaces">
        <div>Surfaces</div>
        <div>
          <div
            v-for="surface in event.surfaces"
            :key="surface.id"
          >
            {{ surface.environment }} {{ surface.surface }}
          </div>
        </div>
      </div>

      <div v-if="showVenues">
        <div>Venues</div>
        <div>
          <div
            v-for="venue in event.venues"
            :key="venue.id"
            class="flex items-center gap-1"
          >
            <span>{{ venue.name ? `${venue.name}, ${venue.city}` : venue.city }}</span>
            <country-link
              :country="venue.country!"
              icon-only
              class="mx-0"
            />
          </div>
        </div>
      </div>

      <div v-if="event.currency && event.pm">
        <div>Prize Money</div>
        <div>{{ event.pm.toLocaleString("en-GB", { style: "currency", currency: event.currency }) }}</div>
      </div>

      <div v-if="event.tfc && event.currency">
        <div>Total Financial Commitment</div>
        <div>{{ event.tfc.toLocaleString("en-GB", { style: "currency", currency: event.currency }) }}</div>
      </div>

      <div v-if="event.supervisors.length">
        <div>Supervisors</div>
        <div>
          <div
            v-for="supervisor in event.supervisors"
            :key="supervisor.id"
          >
            {{ supervisor.first_name }} {{ supervisor.last_name }}
          </div>
        </div>
      </div>

      <div>
        <div>Updated at</div>
        <div>
          <u-badge
            color="success"
            :label="formatDateTime(event.updated_at)"
          />
        </div>
      </div>
    </div>
  </dashboard-subpanel>
</template>
