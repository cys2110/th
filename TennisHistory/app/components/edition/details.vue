<script setup lang="ts">
import { parseDate } from "@internationalized/date"

const {
  params: { id, edId }
} = useRoute("edition")

const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const xlAndUp = breakpoints.greaterOrEqual("xl")

const supabase = useSupabaseClient()

const key = computed(() => `${edId}-details`)

const {
  data: edition,
  pending,
  refresh
} = await useAsyncData(key, async () => {
  const { data, error } = await supabase
    .from("editions")
    .select(
      `
      *,
      events(
        *,
        event_supervisor_mapping(people(*)),
        event_surface_mapping(surfaces(*)),
        event_venue_mapping(venues(*, countries(*)))
      )
    `
    )
    .eq("id", Number(edId))
    .single()

  if (error || !data) {
    console.error("Error fetching edition:", error)
    return null
  }

  const { events, ...rest } = data

  return {
    ...rest,
    events: events.map(event => {
      const { event_supervisor_mapping, event_surface_mapping, event_venue_mapping, ...rest } = event

      return {
        ...rest,
        supervisors: event_supervisor_mapping.map(mapping => mapping.people),
        surfaces: event_surface_mapping.map(mapping => mapping.surfaces),
        venues: event_venue_mapping.map(mapping => {
          return {
            id: mapping.venues?.id,
            name: mapping.venues?.name,
            city: mapping.venues?.city,
            country: mapping.venues?.countries
          }
        })
      }
    })
  } as EditionInterface
})

const showSurfaces = computed(() => {
  if (!edition.value) return true

  if (edition.value?.events.length === 1) return false

  const firstSurfaces = edition.value?.events[0]?.surfaces || []
  const followingSurfaces = edition.value?.events.slice(1).map(e => e?.surfaces) || []

  return !followingSurfaces.every(s => isEqual(s, firstSurfaces))
})

const showVenues = computed(() => {
  if (!edition.value) return true

  if (edition.value?.events.length === 1) return false

  const firstVenues = edition.value?.events[0]?.venues || []
  const followingVenues = edition.value?.events.slice(1).map(e => e?.venues) || []

  return !followingVenues.every(v => isEqual(v, firstVenues))
})
</script>

<template>
  <div>
    <dev-only>
      <div class="flex justify-end">
        <u-field-group class="w-fit">
          <lazy-event-create
            hydrate-on-idle
            @refresh="refresh"
          />
          <lazy-scrape-results
            v-if="id === '9210'"
            hydrate-on-idle
          />
          <lazy-scrape-atp-stats
            v-if="id === '9210'"
            hydrate-on-idle
            :start-date="edition!.start_date"
          />
          <lazy-edition-country-rounds-create
            v-if="COUNTRY_DRAWS.includes(id)"
            hydrate-on-idle
          />
        </u-field-group>
      </div>
    </dev-only>

    <div
      v-if="edition || pending"
      class="flex gap-4 2xl:max-w-3/4 mx-auto"
    >
      <div
        class="flex-1 divide-y divide-default text-sm rounded-md overflow-hidden *:grid *:grid-cols-2 *:*:odd:bg-elevated *:*:odd:dark:bg-muted/50 *:*:px-4 *:*:py-1 *:*:even:font-medium *:*:even:text-muted"
      >
        <div>
          <div>Sponsor Name</div>
          <div v-if="pending">
            <u-skeleton class="w-full h-4" />
          </div>
          <div v-else>
            {{ edition?.sponsor_name || "—" }}
          </div>
        </div>

        <div v-if="edition?.category || pending">
          <div>Category</div>
          <div v-if="pending">
            <u-skeleton class="w-full h-4" />
          </div>
          <div v-else>
            {{ edition?.category }}
          </div>
        </div>

        <div v-if="!showSurfaces">
          <div>Surfaces</div>
          <div v-if="pending">
            <u-skeleton class="w-full h-4" />
          </div>
          <div v-else>
            <div
              v-if="
                edition?.events &&
                useArrayUnique(
                  edition.events.flatMap(e => e.surfaces),
                  (a, b) => a.id === b.id
                ).value.length
              "
              v-for="surface in edition?.events.flatMap(e => e.surfaces)"
              :key="surface.id"
            >
              {{ surface.environment }} {{ surface.surface }}
            </div>
            <div v-else>—</div>
          </div>
        </div>

        <div v-if="!showVenues">
          <div>Venues</div>
          <div v-if="pending">
            <u-skeleton class="w-full h-4" />
          </div>
          <div v-else>
            <div
              v-if="
                edition?.events &&
                useArrayUnique(
                  edition.events.flatMap(e => e.venues),
                  (a, b) => a.id === b.id
                ).value.length
              "
              v-for="venue in edition?.events.flatMap(e => e.venues)"
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

        <div v-if="edition?.currency || pending">
          <div>Total Financial Commitment</div>
          <div v-if="pending">
            <u-skeleton class="w-full h-4" />
          </div>
          <div v-else>
            {{ edition?.tfc?.toLocaleString("en-GB", { style: "currency", currency: edition.currency! }) }}
          </div>
        </div>

        <div v-if="COUNTRY_DRAWS.includes(id)">
          <div>Supervisors</div>
          <div v-if="pending">
            <u-skeleton class="w-full h-4" />
          </div>
          <div v-else>
            <div
              v-if="edition?.events.flatMap(e => e.supervisors).length"
              v-for="supervisor in edition.events.flatMap(e => e.supervisors)"
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
          </dev-only>
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
  </div>

  <div
    v-if="!COUNTRY_DRAWS.includes(id) && id !== '9210'"
    class="flex flex-wrap gap-5"
  >
    <event-details
      v-for="event in edition?.events"
      :key="event.id"
      :event
      :show-surfaces
      :show-venues
      :start-date="edition!.start_date"
    />
  </div>
</template>
