<script setup lang="ts">
import { formatDate, ICONS, kebabCase, useArrayUnique } from "#imports"

const props = defineProps<{ edition: ArchiveInterface }>()

const editionSurfaces = computed(() => {
  if (
    props.edition.events.length === 1 ||
    (props.edition.events[0]?.surfaces &&
      props.edition.events[1]?.surfaces &&
      isEqual(props.edition.events[0]!.surfaces, props.edition.events[1]!.surfaces))
  ) {
    return {
      show: true,
      surfaces: props.edition.events[0]!.surfaces
    }
  } else {
    return {
      show: false,
      surfaces: []
    }
  }
})

const editionVenues = computed(() => {
  if (
    props.edition.events.length === 1 ||
    (props.edition.events[0]?.venues && props.edition.events[1]?.venues && isEqual(props.edition.events[0]!.venues, props.edition.events[1]!.venues))
  ) {
    return {
      show: true,
      venues: useArrayUnique(props.edition.events[0]!.venues, (a, b) => a.city === b.city).value
    }
  } else {
    return {
      show: false,
      venues: []
    }
  }
})
</script>

<template>
  <u-card
    class="flex flex-col"
    :class="edition.tours.length === 1 ? `ring-${edition.tours[0]}` : 'ring-primary'"
    :ui="{ body: 'flex-1 text-sm' }"
  >
    <template #header>
      <div>
        <u-link
          :to="{ name: 'tournament', params: { id: edition.tournament.id, name: kebabCase(edition.tournament.name) } }"
          class="hover-link primary-link font-semibold"
        >
          {{ edition.tournament.name }}
        </u-link>
      </div>
      <div
        v-if="edition.sponsor_name"
        class="text-sm"
      >
        {{ edition.sponsor_name }}
      </div>
    </template>

    <template #default>
      <div v-if="edition.start_date && edition.end_date">
        <div class="text-muted">Dates:</div>
        <div class="ml-3">{{ formatDate(edition.start_date, edition.end_date) }}</div>
      </div>

      <div v-if="edition.category">
        <div class="text-muted">Category:</div>
        <div class="ml-3">{{ edition.category }}</div>
      </div>

      <div v-if="editionSurfaces.show">
        <div class="text-muted">Surfaces:</div>
        <div class="space-y-0.5 ml-3">
          <div
            v-for="surface in editionSurfaces.surfaces"
            :key="surface.id"
          >
            {{ surface.environment }} {{ surface.surface }}
          </div>
        </div>
      </div>

      <div v-if="editionVenues.show">
        <div class="text-muted">Locations:</div>
        <div class="space-y-0.5 ml-3">
          <div
            v-for="venue in editionVenues.venues"
            :key="venue.id"
            class="flex items-center gap-1"
          >
            {{ venue.city }}
            <country-link
              :country="venue.country"
              icon-only
            />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <u-page-feature
          v-for="event in edition.events"
          :key="event.id"
          :ui="{ root: 'my-1.5', title: 'space-x-1', description: 'text-sm' }"
        >
          <template #title>
            <u-badge
              v-if="event.level"
              :label="event.level"
              :color="event.level"
            />
            <u-badge
              v-if="event.tour"
              :label="event.tour"
              :color="event.tour"
            />
          </template>
          <template #description>
            <div
              v-if="event.sponsor_name"
              class="text-toned"
            >
              {{ event.sponsor_name }}
            </div>

            <div v-if="event.start_date && event.end_date">
              <div>Dates: </div>
              <div class="ml-3 text-toned">{{ formatDate(event.start_date, event.end_date) }}</div>
            </div>

            <div v-if="event.category">
              <div>Category: </div>
              <div class="ml-3 text-toned">{{ event.category }}</div>
            </div>

            <div v-if="!editionSurfaces.show">
              <div>Surfaces:</div>
              <div class="space-y-0.5 ml-3 text-toned">
                <div
                  v-for="surface in event.surfaces"
                  :key="surface.id"
                >
                  {{ surface.environment }} {{ surface.surface }}
                </div>
              </div>
            </div>

            <div v-if="!editionVenues.show">
              <div class="text-muted">Locations:</div>
              <div class="space-y-0.5 ml-3">
                <div
                  v-for="venue in useArrayUnique(event.venues, (a, b) => a.city === b.city).value"
                  :key="venue.id"
                  class="flex items-center gap-1"
                >
                  {{ venue.city }}
                  <country-link
                    :country="venue.country"
                    icon-only
                  />
                </div>
              </div>
            </div>
          </template>
        </u-page-feature>
      </div>
    </template>

    <template #footer>
      <u-field-group class="w-full">
        <u-button
          block
          :to="{
            name: 'edition',
            params: { id: edition.tournament.id, name: kebabCase(edition.tournament.name), year: edition.year, edition_id: edition.id }
          }"
          label="Details"
          :icon="ICONS.overview"
        />

        <u-button
          block
          :to="{
            name: 'results',
            params: { id: edition.tournament.id, name: kebabCase(edition.tournament.name), year: edition.year, edition_id: edition.id }
          }"
          label="Results"
          :icon="ICONS.cards"
        />

        <u-button
          block
          :to="{
            name: 'draws',
            params: { id: edition.tournament.id, name: kebabCase(edition.tournament.name), year: edition.year, edition_id: edition.id }
          }"
          label="Draws"
          :icon="ICONS.draw"
          :ui="{ leadingIcon: 'rotate-270' }"
        />
      </u-field-group>
    </template>
  </u-card>
</template>
