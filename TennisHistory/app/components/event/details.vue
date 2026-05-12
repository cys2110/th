<script setup lang="ts">
import { parseDate } from "@internationalized/date"

const props = defineProps<{
  event: EventInterface
  showSurfaces: boolean
  showVenues: boolean
  startDate: string | null
}>()

const {
  ui: { icons }
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
          :color="event.tour"
        />

        <u-badge
          v-if="event.level"
          :label="event.level"
          :color="event.level"
        />
      </div>
    </template>

    <template #right>
      <u-field-group>
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
          <lazy-scrape-atp-draw
            v-if="event.tour === 'ATP'"
            hydrate-on-idle
          />

          <lazy-scrape-wta-draw
            v-else-if="event.tour === 'WTA'"
            hydrate-on-idle
          />

          <lazy-scrape-results
            v-if="event.tour === 'ATP'"
            hydrate-on-idle
          />

          <lazy-scrape-atp-stats
            v-if="event.tour === 'ATP'"
            hydrate-on-idle
            :start-date="startDate || event.start_date"
          />

          <lazy-scrape-wta-stats
            v-else-if="event.tour === 'WTA'"
            hydrate-on-idle
          />
        </dev-only>
      </u-field-group>
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
        <div>
          {{ event.sponsor_name }}
        </div>
      </div>

      <div v-if="event.category">
        <div>Category</div>
        <div>
          {{ event.category }}
        </div>
      </div>

      <div v-if="showSurfaces">
        <div>Surfaces</div>
        <div>
          <div
            v-if="event.surfaces.length"
            v-for="surface in event.surfaces"
            :key="surface.id"
          >
            {{ surface.environment }} {{ surface.surface }}
          </div>
          <div v-else>—</div>
        </div>
      </div>

      <div v-if="showVenues">
        <div>Venues</div>
        <div>
          <div
            v-if="event.venues.length"
            v-for="venue in event.venues"
            :key="venue.id"
            class="flex items-center gap-2"
          >
            {{ venue.name ? `${venue.name}, ${venue.city}` : venue.city }}
            <country-link
              :country="venue.country"
              icon-only
            />
          </div>
          <div v-else>—</div>
        </div>
      </div>

      <div v-if="event.pm && event.currency">
        <div>Prize Money</div>
        <div>
          {{ event.pm.toLocaleString("en-GB", { style: "currency", currency: event.currency }) }}
        </div>
      </div>

      <div v-if="event.tfc && event.currency">
        <div>Total Financial Commitment</div>
        <div>
          {{ event.tfc.toLocaleString("en-GB", { style: "currency", currency: event.currency }) }}
        </div>
      </div>

      <div>
        <div>Supervisors</div>
        <div>
          <div
            v-if="event.supervisors.length"
            v-for="supervisor in event.supervisors"
            :key="supervisor.id"
          >
            {{ supervisor.first_name }} {{ supervisor.last_name }}
          </div>
          <div v-else>—</div>
        </div>
      </div>

      <div>
        <dev-only>
          <div>Updated at</div>
          <div>
            <u-badge
              :label="formatDateTime(event.updated_at)"
              color="success"
            />
          </div>
        </dev-only>
      </div>
    </div>
  </dashboard-subpanel>
</template>
