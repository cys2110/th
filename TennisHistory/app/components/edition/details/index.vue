<script setup lang="ts">
const {
  params: { id, edId }
} = useRoute("edition")

const { data: edition, pending } = await useAsyncData("edition-details", async () => {
  const supabase = useSupabaseClient()

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
    <edition-details-table
      :edition
      :pending
    />

    <div
      v-if="!COUNTRY_DRAWS.includes(id) && id !== '9210'"
      class="flex flex-wrap lg:flex-nowrap gap-5 mt-5"
    >
      <event-details
        v-for="event in edition?.events"
        :key="event.id"
        :event
        :show-surfaces
        :show-venues
      />
    </div>
  </div>
</template>
