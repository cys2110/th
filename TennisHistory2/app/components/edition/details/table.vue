<script setup lang="ts">
import { parseDate } from "@internationalized/date"

const props = defineProps<{
  edition?: EditionInterface | null
  pending: boolean
}>()

const {
  params: { year }
} = useRoute("edition")

const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const xlAndUp = breakpoints.greaterOrEqual("xl")

const tournamentStore = useTournamentStore()

const surfaces = computed(() => {
  if (props.edition?.events.length === 1) {
    return props.edition?.events[0]?.surfaces || []
  } else if (props.edition?.events.length) {
    const firstSurfaces = props.edition?.events[0]?.surfaces
    const followingSurfaces = props.edition?.events.slice(1).map(e => e?.surfaces)

    if (followingSurfaces.every(s => isEqual(s, firstSurfaces))) {
      return firstSurfaces || []
    }

    return []
  }

  return []
})

const venues = computed(() => {
  if (props.edition?.events.length === 1) {
    return props.edition?.events[0]?.venues || []
  } else if (props.edition?.events.length) {
    const firstVenues = props.edition?.events[0]?.venues
    const followingVenues = props.edition?.events.slice(1).map(e => e?.venues)

    if (followingVenues.every(v => isEqual(v, firstVenues))) {
      return firstVenues || []
    }

    return []
  }

  return []
})

const supervisors = computed(() => {
  if (COUNTRY_DRAWS.includes(tournamentStore.id)) {
    return props.edition?.events[0]?.supervisors || []
  }

  return []
})
</script>

<template>
  <div
    v-if="edition || pending"
    class="flex items-center gap-4"
  >
    <div
      class="flex-1 divide-y divide-default text-sm rounded-md overflow-hidden *:grid *:grid-cols-2 *:*:odd:bg-elevated *:*:odd:dark:bg-muted/50 *:*:px-4 *:*:py-1 *:*:even:font-medium *:*:even:text-muted"
    >
      <div v-if="edition?.sponsor_name">
        <div>Sponsor Name</div>
        <div v-if="pending">
          <u-skeleton class="w-full h-4" />
        </div>
        <div v-else>
          {{ edition.sponsor_name || "—" }}
        </div>
      </div>

      <div v-if="edition?.category">
        <div>Category</div>
        <div v-if="pending">
          <u-skeleton class="w-full h-4" />
        </div>
        <div v-else>
          {{ edition.category || "—" }}
        </div>
      </div>

      <div v-if="surfaces.length">
        <div>Surfaces</div>
        <div v-if="pending">
          <u-skeleton class="w-full h-4" />
        </div>
        <div v-else>
          <div
            v-for="surface in surfaces"
            :key="surface.id"
          >
            {{ surface.environment }} {{ surface.surface }}
          </div>
        </div>
      </div>

      <div v-if="venues.length">
        <div>Venues</div>
        <div v-if="pending">
          <u-skeleton class="w-full h-4" />
        </div>
        <div v-else>
          <div
            v-for="venue in venues"
            :key="venue.id"
            class="flex items-center gap-2"
          >
            {{ venue.name ? `${venue.name}, ${venue.city}` : venue.city }}
            <country-link
              :country="venue.country!"
              icon-only
            />
          </div>
        </div>
      </div>

      <div v-if="edition?.currency && edition?.tfc">
        <div>Total Financial Commitment</div>
        <div v-if="pending">
          <u-skeleton class="w-full h-4" />
        </div>
        <div v-else>
          {{ edition.tfc.toLocaleString("en-GB", { style: "currency", currency: edition.currency }) || "—" }}
        </div>
      </div>

      <div v-if="supervisors.length">
        <div>Supervisors</div>
        <div v-if="pending">
          <u-skeleton class="w-full h-4" />
        </div>
        <div v-else>
          <div
            v-for="supervisor in supervisors"
            :key="supervisor.id"
          >
            {{ supervisor.first_name }} {{ supervisor.last_name }}
          </div>
        </div>
      </div>

      <div>
        <div>Updated at</div>
        <div v-if="pending">
          <u-skeleton class="w-full h-4" />
        </div>
        <div v-else>
          <u-badge
            v-if="edition?.updated_at"
            :label="formatDateTime(edition.updated_at)"
            color="success"
          />
        </div>
      </div>
    </div>

    <u-calendar
      v-if="edition?.start_date && edition?.end_date"
      range
      :default-value="{ start: parseDate(edition.start_date), end: parseDate(edition.end_date) }"
      readonly
      :month-controls="false"
      :year-controls="false"
      :week-starts-on="1"
      :weekday-format="xlAndUp ? 'long' : 'short'"
      class="max-w-fit mx-auto"
    />
  </div>

  <empty
    v-else
    :message="`No details found for ${tournamentStore.name} ${year}`"
  />
</template>
