<script setup lang="ts">
const { events, status } = defineProps<{
  events: Pick<EventInterface, "id" | "year" | "tournament" | "venues" | "tours">[]
  status: APIStatusType
}>()

const { icons } = useAppConfig()
const { params } = useRoute()
const name = computed(() => decodeName(params.name as string))
</script>

<template>
  <u-page-columns
    v-if="events.length || ['pending', 'idle'].includes(status)"
    class="lg:columns-2 xl:columns-3 2xl:columns-4"
  >
    <u-card
      v-if="events.length"
      v-for="event in events"
      :key="event.id"
      :class="getTourColours(event.tours).ringColour"
      :ui="{ header: 'flex flex-row justify-between items-center font-semibold w-full' }"
    >
      <template #header>
        <u-link
          :to="{
            name: 'tournament',
            params: {
              id: event.tournament.id,
              name: encodeName(event.tournament.name)
            }
          }"
          class="hover-link"
        >
          {{ event.tournament.name }}
        </u-link>
        <u-link
          :to="{
            name: 'event',
            params: {
              id: event.tournament.id,
              name: encodeName(event.tournament.name),
              year: event.year,
              eid: event.id
            }
          }"
          class="hover-link"
        >
          {{ event.year }}
        </u-link>
      </template>
      <div class="flex flex-col gap-2 text-sm">
        <u-link
          v-for="venue in event.venues"
          :key="venue.id"
          :to="{
            name: 'venue',
            params: { id: encodeName(venue.id) }
          }"
          class="hover-link w-fit"
        >
          {{ venue.name ? `${venue.name}, ${venue.city}` : venue.city }}
        </u-link>
      </div>
    </u-card>
    <loading-event
      v-else
      v-for="_ in 6"
      :key="_"
    />
  </u-page-columns>
  <error-message
    v-else
    :message="`No events played in ${name}`"
    :icon="icons.noCalendar"
  />
</template>
