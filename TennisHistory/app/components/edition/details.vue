<script setup lang="ts">
import { parseDate } from "@internationalized/date"
import { breakpointsTailwind, useBreakpoints, useSSRWidth } from "@vueuse/core"

const route = useRoute("edition")
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const { isAdmin } = useAuthState()
const tournamentStore = useTournamentStore()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const xlAndUp = breakpoints.greaterOrEqual("xl")

const {
  data: edition,
  pending,
  refresh
} = await useAsyncData(
  () => `edition-details-${JSON.stringify(route.params)}`,
  async () => {
    const { data, error } = await fetchEdition(supabase, route.params.id, route.params.year, route.params.edition_no)

    if (error || !data) {
      console.error("Error fetching edition:", error)
      return null
    }

    return data
  }
)
</script>

<template>
  <div
    v-if="isAdmin"
    class="flex justify-end my-6"
  >
    <u-field-group>
      <u-button
        :icon="ui.icons.reload"
        @click="refresh()"
      />

      <lazy-edition-event-create
        v-if="edition"
        hydrate-on-idle
        @refresh="refresh"
        :edition-id="edition?.id"
      />
    </u-field-group>
  </div>

  <u-container
    v-if="edition"
    class="flex gap-6 my-6 w-fit"
  >
    <u-calendar
      v-if="edition.start_date && edition.end_date"
      range
      :default-value="{ start: parseDate(edition.start_date), end: parseDate(edition.end_date) }"
      readonly
      :month-controls="false"
      :year-controls="false"
      :week-starts-on="1"
      :weekday-format="xlAndUp ? 'long' : 'short'"
    />

    <div class="grid grid-flow-col grid-rows-3 gap-6 mt-6">
      <u-page-feature
        v-if="edition.sponsor_name"
        :title="edition.sponsor_name"
        description="Sponsor Name"
      />

      <u-page-feature
        v-if="edition.category"
        :title="edition.category"
        description="Category"
      />

      <u-page-feature
        v-if="edition.currency && edition.tfc"
        :title="edition.tfc.toLocaleString('en-GB', { style: 'currency', currency: edition.currency })"
        description="Total Financial Commitment"
      />

      <u-page-feature
        v-if="edition.surface"
        :title="edition.surface"
        description="Surface"
      />

      <u-page-feature
        v-if="edition.venue"
        :title="edition.venue.name ? `${edition.venue.name}, ${edition.venue.city}` : edition.venue.city"
        :icon="edition.venue.icon"
        description="Venue"
      />

      <u-page-feature
        v-if="isAdmin"
        description="Updated at"
      >
        <template #title>
          <nuxt-time
            :datetime="edition.updated_at"
            year="numeric"
            month="long"
            day="numeric"
            hour="2-digit"
            minute="2-digit"
            time-zone="America/New_York"
          />
        </template>
      </u-page-feature>
    </div>
  </u-container>

  <div class="flex flex-wrap xl:flex-nowrap my-6">
    <edition-event-details
      v-for="event in edition?.events"
      :key="event.id"
      :event
      @refresh="refresh"
    />
  </div>
</template>
