<script setup lang="ts">
const {
  params: { tour, edId }
} = useRoute("event")

const { data: event } = await useFetch<EventInterface>("/api/events/event", {
  key: `${edId}-${tour}`,
  query: { id: `${edId}-${tour}` }
})
</script>

<template>
  <div
    id="details"
    class="columns-1 md:columns-2 lg:columns-3 gap-3 text-sm space-y-3 *:border *:border-primary *:rounded-md *:p-3 *:break-inside-avoid-column *:will-change-transform *:*:first:font-semibold *:*:first:text-muted *:*:not-first:ml-3"
  >
    <div v-if="event?.sponsor_name || event?.edition.sponsor_name">
      <div>Sponsor Name</div>
      <div>{{ event?.sponsor_name || event?.edition.sponsor_name }}</div>
    </div>

    <div>
      <div>Category</div>
      <div>{{ event?.category || event?.edition.category }}</div>
    </div>

    <div>
      <div>Dates</div>
      <div v-if="event">{{
        dateTimeFormat.formatRange(new Date(event.start_date || event.edition.start_date!), new Date(event.end_date || event.edition.end_date!))
      }}</div>
    </div>

    <div>
      <div>Surface</div>
      <div>{{ event?.surface?.id || event?.edition.surface?.id }}</div>
    </div>

    <div v-if="event?.venues?.length || event?.edition.venues?.length">
      <div>Venues</div>
      <div>
        <dev-only>
          <venues-update
            v-for="venue in event.venues || event.edition.venues"
            :key="venue.id"
            :venue
          />
          <template #fallback>
            <div
              v-for="venue in event.venues || event.edition.venues"
              :key="venue.id"
              class="flex items-center w-fit gap-1"
            >
              <span>{{ venue.name ? `${venue.name}, ${venue.city}` : venue.city }}</span>
              <countries-link
                :country="venue.country"
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

    <div v-if="event?.currency && (event?.tfc || event?.edition.tfc)">
      <div>Total Financial Commitment</div>
      <div>{{ (event.tfc || event.edition.tfc!).toLocaleString("en-GB", { style: "currency", currency: event.currency }) }}</div>
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
  </div>
</template>
