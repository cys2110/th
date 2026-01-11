<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"

const { event } = defineProps<{ event: ConsolidatedActivityType }>()
const {
  params: { id, name }
} = useRoute("activity")
const router = useRouter()

const handleSelect = (e: Event, row: TableRow<ActivityMatchType>) => {
  if (row.original.stats) {
    router.push({
      name: "match",
      params: {
        id: event.tournament.id,
        name: kebabCase(event.tournament.name),
        year: event.year,
        edId: event.id
      },
      query: {
        tour: event.tour,
        type: event.type,
        draw: row.original.draw,
        match_no: row.original.match_no
      }
    })
  }
}
</script>

<template>
  <u-page-card
    highlight
    orientation="horizontal"
    :ui="{ container: 'lg:grid-cols-5', wrapper: 'lg:col-span-2', title: 'text-lg', description: 'text-sm' }"
  >
    <template #leading>
      <u-badge
        :color="event.tour"
        :label="event.tour"
      />
      <u-badge
        :color="event.level"
        :label="event.level"
        class="ml-2"
      />
    </template>

    <template #title>
      <div>
        <u-link
          class="hover-link default-link"
          :to="{ name: 'tournament', params: { id: event.tournament.id, name: kebabCase(event.tournament.name) } }"
        >
          {{ event.tournament.name }}
        </u-link>
        <u-link
          class="hover-link default-link ml-1"
          :to="{
            name: 'edition',
            params: { id: event.tournament.id, name: kebabCase(event.tournament.name), year: event.year, edId: event.id }
          }"
        >
          {{ event.year }}
        </u-link>
      </div>
      <div
        class="text-sm font-medium"
        v-if="event.sponsor_name"
      >
        {{ event.sponsor_name }}
      </div>
    </template>

    <template #description>
      <div class="flex flex-wrap space-x-5 space-y-2 *:*:first:font-semibold *:*:not-first:ml-3">
        <div>
          <div>Category</div>
          <div>{{ event.category }}</div>
        </div>
        <div>
          <div>Dates</div>
          <div>{{ dateTimeFormat.formatRange(new Date(event.start_date!), new Date(event.end_date!)) }}</div>
        </div>
        <div>
          <div>Surface</div>
          <div>{{ event.surface?.id }}</div>
        </div>
        <div>
          <div>Venues</div>
          <div
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
        </div>
        <div v-if="event.partner">
          <div>Partner</div>
          <player-link :player="event.partner" />
        </div>
      </div>

      <div class="flex flex-wrap gap-2 mt-2">
        <u-badge
          v-if="event.player.seed || event.player.q_seed"
          :color="event.player.seed ? 'Doubles' : 'Main'"
          :label="`Seed: ${event.player.seed ?? `Q-${event.player.q_seed}`}`"
        />

        <u-badge
          v-if="event.player.status"
          color="Singles"
          :label="`Status: ${statusEnum[event.player.status]}`"
        />

        <u-badge
          v-if="event.player.q_status"
          color="warning"
          :label="`Status: Q-${statusEnum[event.player.q_status]}`"
        />

        <u-badge
          v-if="isDefined(event.player.rank)"
          color="Active"
          :label="`Rank: ${event.player.rank.toLocaleString()}`"
        />

        <u-badge
          v-if="isDefined(event.player.points)"
          color="Inactive"
          :label="`Points: ${event.player.points.toLocaleString()}`"
        />

        <u-badge
          v-if="isDefined(event.player.pm) && event.currency"
          color="Qualifying"
          :label="`Prize Money:
        ${event.player.pm.toLocaleString('en-GB', { style: 'currency', currency: event.currency })}`"
        />
      </div>
    </template>

    <u-table
      :data="event.match"
      :columns="activityCardColumns(event, id, name)"
      @select="handleSelect"
      class="lg:col-span-3"
      :meta="{
        class: {
          tr: (row: TableRow<ActivityMatchType>) => `${row.original.draw === 'Main' ? '' : 'bg-elevated'} ${row.original.stats ? 'cursor-pointer' : ''}`
        }
      }"
    />
  </u-page-card>
</template>
