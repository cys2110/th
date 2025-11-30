<script setup lang="ts">
import { parseDate } from "@internationalized/date"

const { event } = defineProps<{
  event: EventType
}>()

const venues = computed(() => {
  if (event.venues.length) {
    return event.venues
  } else if (event.edition?.venues?.length) {
    return event.edition.venues
  }
})
</script>

<template>
  <details-grid id="details">
    <div v-if="event">
      <u-calendar
        range
        :default-value="{ start: parseDate(event.start_date || event.edition?.start_date!), end: parseDate(event.end_date || event.edition?.end_date!) }"
        readonly
        :month-controls="false"
        :year-controls="false"
        :week-starts-on="1"
        weekday-format="long"
      />
    </div>

    <div v-if="event?.sponsor_name || event?.edition?.sponsor_name">
      <div>Sponsor Name</div>
      <div>{{ event?.sponsor_name || event?.edition?.sponsor_name }}</div>
    </div>

    <div>
      <div>Category</div>
      <div>{{ event?.category || event?.edition?.category }}</div>
    </div>

    <div>
      <div>Surface</div>
      <div>{{ event?.surface?.id || event?.edition?.surface?.id }}</div>
    </div>

    <div>
      <div>Venues</div>
      <div>
        <dev-only>
          <venues-update
            v-for="venue in venues"
            :key="venue.id"
            :venue
          />
          <template #fallback>
            <div
              v-for="venue in venues"
              :key="venue.id"
              class="flex items-center w-fit gap-1"
            >
              <span>{{ venue.name ? `${venue.name}, ${venue.city}` : venue.city }}</span>
              <countries-link
                :country="venue.country!"
                icon-only
              />
            </div>
          </template>
        </dev-only>
      </div>
    </div>

    <div v-if="event?.pm && event?.currency">
      <div>Prize Money</div>
      <div>{{ event.pm.toLocaleString("en-GB", { style: "currency", currency: event.currency }) }}</div>
    </div>

    <div v-if="event?.currency && (event?.tfc || event?.edition?.tfc)">
      <div>Total Financial Commitment</div>
      <div>{{ (event.tfc ?? event.edition?.tfc!).toLocaleString("en-GB", { style: "currency", currency: event.currency }) }}</div>
    </div>

    <div v-if="event?.supervisors?.length">
      <div>Supervisors</div>
      <div>
        <dev-only>
          <person-update
            v-for="supervisor in event.supervisors"
            :key="supervisor.id"
            :person="supervisor"
            type="Supervisor"
          />
          <template #fallback>
            <div
              v-for="supervisor in event.supervisors"
              :key="supervisor.id"
            >
              {{ supervisor.id }}
            </div>
          </template>
        </dev-only>
      </div>
    </div>

    <div>
      <div>Draws</div>
      <div>
        <div
          v-if="event?.s_draw"
          class="flex items-center gap-2"
        >
          <u-icon :name="ICONS.person" />
          {{ event.s_draw }}
        </div>
        <div
          v-if="event?.d_draw"
          class="flex items-center gap-2"
        >
          <u-icon :name="ICONS.people" />
          {{ event.d_draw }}
        </div>
      </div>
    </div>
  </details-grid>
</template>
