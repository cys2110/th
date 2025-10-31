<script setup lang="ts">
import { PlayerActivityDoublesActivity, PlayerActivitySinglesActivity } from "#components"

const { event, year } = defineProps<{
  event: ActivityEventInterface
  year: string
  tour: TourType
  matchType: MatchType
}>()

const earnings = {
  Seed: event.player.seed,
  "Qualifying Seed": event.player.q_seed,
  Status: event.player.status,
  "Qualifying Status": event.player.q_status,
  Points: event.player.points?.toLocaleString(),
  Rank: event.player.rank,
  ...(event.player.pm && {
    "Prize Money": `${CURRENCIES[event.currency ?? event.atp_currency ?? event.wta_currency ?? event.men_currency ?? event.women_currency!]}${event.player.pm.toLocaleString()}`
  })
}

const tagColors = {
  Seed: "doubles",
  "Qualifying Seed": "success",
  Status: "singles",
  "Qualifying Status": "warning",
  Points: "joint",
  Rank: "active",
  "Prize Money": "info"
}

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric"
})
</script>

<template>
  <u-page-card
    highlight
    :highlight-color="tour === 'ATP' ? 'atp' : 'wta'"
    :ui="{ body: 'w-full', footer: 'flex items-center justify-between w-full', root: 'my-5' }"
  >
    <template #title>
      <div class="flex flex-wrap justify-between items-center">
        <u-link
          :to="{ name: 'tournament', params: { id: event.tournament.id, name: kebabCase(event.tournament.name) } }"
          class="font-semibold text-base hover-link"
        >
          {{ event.tournament.name }}
        </u-link>
        <div
          v-if="event.sponsor_name"
          class="font-normal"
        >
          {{ event.sponsor_name }}
        </div>
      </div>
      <div class="flex flex-wrap justify-between items-center">
        <u-link
          v-if="event.category || event.atp_category || event.wta_category || event.men_category || event.women_category"
          :to="{
            name: 'category',
            params: {
              id: kebabCase(
                event.category ?? (tour === 'ATP' ? (event.atp_category ?? event.men_category) : (event.wta_category ?? event.women_category))!
              )
            }
          }"
          class="hover-link"
        >
          {{ event.category ?? (tour === "ATP" ? (event.atp_category ?? event.men_category) : (event.wta_category ?? event.women_category)) }}
        </u-link>
        <div>{{
          event.start_date && event.end_date ? dateTimeFormat.formatRange(getDate(event.start_date), getDate(event.end_date))
          : event.atp_start_date && event.atp_end_date ? dateTimeFormat.formatRange(getDate(event.atp_start_date), getDate(event.atp_end_date))
          : event.wta_start_date && event.wta_end_date ? dateTimeFormat.formatRange(getDate(event.wta_start_date), getDate(event.wta_end_date))
          : event.men_start_date && event.men_end_date ? dateTimeFormat.formatRange(getDate(event.men_start_date), getDate(event.men_end_date))
          : event.women_start_date && event.women_end_date ?
            dateTimeFormat.formatRange(getDate(event.women_start_date), getDate(event.women_end_date))
          : ""
        }}</div>
        <div class="flex flex-wrap items-center gap-2">
          <div>{{ event.venues.map(location => location.city).join(" | ") }}</div>
          <u-link
            v-if="event.venues[0]?.country"
            :to="{ name: 'country', params: { id: event.venues[0].country.id, name: kebabCase(event.venues[0].country.name) } }"
            class="flex items-center"
          >
            <u-icon
              :name="getFlagCode(event.venues[0].country)"
              class="text-xl"
            />
          </u-link>
        </div>
      </div>
      <div
        v-if="event.partner"
        class="flex items-center gap-2 text-sm my-3 w-full justify-end"
      >
        <div>Partner:</div>
        <player-link :player="event.partner" />
        <span v-if="event.partner.rank">({{ event.partner.rank }})</span>
      </div>
    </template>

    <template #description>
      <component
        :is="matchType === 'Singles' ? PlayerActivitySinglesActivity : PlayerActivityDoublesActivity"
        :key="matchType"
        :matches="event.matches"
        :partner="event.partner"
        :year
        :id="event.id"
        :tournament="event.tournament"
        :tour
      />
    </template>

    <template #footer>
      <div class="flex gap-1 gap-y-2 flex-wrap justify-center md:justify-start">
        <template
          v-for="(value, key) in earnings"
          :key
        >
          <u-badge
            v-if="value"
            class="font-semibold"
            :color="tagColors[key] as 'atp'"
          >
            {{ key }}: {{ value }}
          </u-badge>
        </template>
      </div>
      <event-buttons
        :tournament="event.tournament"
        :year="Number(year)"
        :id="event.id"
      />
    </template>
  </u-page-card>
</template>
