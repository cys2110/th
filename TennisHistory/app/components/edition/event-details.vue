<script setup lang="ts">
import { parseDate } from "@internationalized/date"
import { breakpointsTailwind, useBreakpoints, useSSRWidth } from "@vueuse/core"

const props = defineProps<{ event: EditionQuery["events"][number] }>()

const emits = defineEmits<{ refresh: [] }>()

const route = useRoute("edition")
const supabase = useSupabaseClient()
const toast = useToast()
const { ui } = useAppConfig()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const xlAndUp = breakpoints.greaterOrEqual("xl")

const { isAdmin } = useAuthState()
const tournamentStore = useTournamentStore()
</script>

<template>
  <div class="w-full xl:min-w-1/2 px-5">
    <dashboard-subpanel>
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

      <template
        #right
        v-if="isAdmin"
      >
        <u-field-group></u-field-group>
      </template>

      <div class="flex gap-6 my-6 w-fit mx-auto">
        <u-calendar
          v-if="event.start_date && event.end_date"
          range
          :default-value="{ start: parseDate(event.start_date), end: parseDate(event.end_date) }"
          readonly
          :month-controls="false"
          :year-controls="false"
          :week-starts-on="1"
          weekday-format="narrow"
          class="min-w-fit"
        />

        <div
          class="grid gap-3"
          :class="event.start_date ? 'grid-cols-2' : 'grid-cols-3'"
        >
          <u-page-feature
            v-if="event.sponsor_name"
            :title="event.sponsor_name"
            description="Sponsor Name"
          />

          <u-page-feature
            v-if="event.category"
            :title="event.category"
            description="Category"
          />

          <u-page-feature
            v-if="event.currency && event.pm"
            :title="event.pm.toLocaleString('en-GB', { style: 'currency', currency: event.currency })"
            description="Prize Money"
          />

          <u-page-feature
            v-if="event.currency && event.tfc"
            :title="event.tfc.toLocaleString('en-GB', { style: 'currency', currency: event.currency })"
            description="Total Financial Commitment"
          />

          <u-page-feature
            v-if="event.currency && event.undefeated_bonus"
            :title="event.undefeated_bonus.toLocaleString('en-GB', { style: 'currency', currency: event.currency })"
            description="Undefeated Bonus"
          />

          <u-page-feature
            v-if="event.surface"
            :title="event.surface"
            description="Surface"
          />

          <u-page-feature
            v-if="event.venue"
            :title="event.venue.name ? `${event.venue.name}, ${event.venue.city}` : event.venue.city"
            :icon="event.venue.icon"
            description="Venue"
          />

          <u-page-feature
            v-if="event.s_draw_size"
            :title="String(event.s_draw_size)"
            description="Singles Draw"
          />

          <u-page-feature
            v-if="event.d_draw_size"
            :title="String(event.d_draw_size)"
            description="Doubles Draw"
          />

          <u-page-feature
            v-if="isAdmin"
            description="Updated at"
          >
            <template #title>
              <nuxt-time
                :datetime="event.updated_at"
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

        <u-page-feature
          v-if="event.event_supervisor_mapping.length"
          description="Supervisors"
          class="min-w-1/7"
        >
          <template #title>
            <div
              v-for="supervisor in event.event_supervisor_mapping"
              :key="supervisor.full_name!"
            >
              {{ supervisor.full_name }}
            </div>
          </template>
        </u-page-feature>
      </div>
    </dashboard-subpanel>
  </div>
</template>
