<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"

const props = defineProps<{
  event: ConsolidatedActivityType
}>()

const {
  params: { id, name }
} = useRoute("activity")
const router = useRouter()
const {
  ui: { colors }
} = useAppConfig()

const descriptionDetails = computed(() => [
  { label: "Category", value: props.event.category },
  { label: "Dates", value: dateTimeFormat.formatRange(new Date(props.event.start_date), new Date(props.event.end_date)) },
  { label: "Surface", value: props.event.surface.id },
  { label: "Venues" }
])

const badges = computed(() => {
  const badges: { label: string; color: keyof typeof colors }[] = []
  const { player, currency } = props.event

  if (player.seed || player.q_seed) badges.push({ label: `Seed: ${player.seed ?? `Q-${player.q_seed}`}`, color: player.seed ? "Doubles" : "Main" })
  if (player.status) badges.push({ label: `Status: ${statusEnum[player.status]}`, color: "Singles" })
  if (player.q_status) badges.push({ label: `Status: Q-${player.q_status}`, color: "warning" })
  if (isDefined(player.rank)) badges.push({ label: `Rank: ${player.rank.toLocaleString()}`, color: "Active" })
  if (isDefined(player.points)) badges.push({ label: `Points: ${player.points.toLocaleString()}`, color: "Inactive" })
  if (isDefined(player.pm) && currency)
    badges.push({ label: `Prize Money: ${player.pm.toLocaleString("en-GB", { style: "currency", currency })}`, color: "Qualifying" })

  return badges
})

const handleSelect = (e: Event, row: TableRow<ActivityMatchType>) => {
  const { tournament, year, id, tour, type } = props.event
  if (row.original.stats) {
    router.push({
      name: "match",
      params: {
        id: tournament.id,
        name: kebabCase(tournament.name),
        year: year,
        edId: id
      },
      query: {
        tour: tour,
        type: type,
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
        :color="event.level"
        :label="event.level"
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
      <div class="flex flex-wrap space-x-5 space-y-2 *:*:first:font-semibold">
        <div
          v-for="detail in descriptionDetails"
          :key="detail.label"
        >
          <div>{{ detail.label }}</div>
          <div v-if="detail.value">{{ detail.value }}</div>
          <div
            v-else
            v-for="venue in event.venues"
            :key="venue.id"
            class="flex items-center gap-2"
          >
            {{ venue.name ? `${venue.name}, ${venue.city}` : venue.city }}
            <countries-link
              :country="venue.country"
              icon-only
            />
          </div>
        </div>

        <div v-if="event.partner">
          <div>Partner</div>
          <players-link :player="event.partner" />
        </div>
      </div>

      <div class="flex flex-wrap gap-2 mt-2">
        <u-badge
          v-for="badge in badges"
          :key="badge.label"
          :label="badge.label"
          :color="badge.color"
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
          tr: (row: TableRow<ActivityMatchType>) => `${row.original.draw === 'Main' ? '' : 'bg-elevated'} ${row.original.stats ? '' : 'cursor-default! hover:bg-default!'}`
        }
      }"
    />
  </u-page-card>
</template>
