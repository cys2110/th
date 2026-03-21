<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { CalendarDate } from "@internationalized/date"

const {
  params: { edId, year }
} = useRoute("edition")

const {
  ui: { icons }
} = useAppConfig()

const toast = useToast()
const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()
const venueSearch = useVenueSearch()
const supervisorsSearch = usePersonSearch()

const isOpen = ref(false)
const isUploading = ref(false)
const errors = ref()

const initialState = {
  id:
    COUNTRY_DRAWS.includes(tournamentStore.id) ? `${edId}-Country`
    : tournamentStore.id === "9210" ? `${edId}-LC`
    : undefined,
  tour: tournamentStore.tours[0],
  edition_id: Number(edId)
}

const state = ref<Partial<EventCreateType>>({ ...initialState })

watch(
  () => state.value.tour,
  () => {
    if (!COUNTRY_DRAWS.includes(tournamentStore.id) && tournamentStore.id !== "9210" && state.value.tour) {
      state.value.id = `${edId}-${state.value.tour}`
    }
  },
  { immediate: true }
)

const dates = shallowRef<{ start: CalendarDate | undefined; end: CalendarDate | undefined }>({ start: undefined, end: undefined })

watch(
  dates,
  newDates => {
    state.value.start_date = newDates.start?.toString() || null
    state.value.end_date = newDates.end?.toString() || null
  },
  { deep: true }
)

watch(
  () => venueSearch.selectedVenues.value,
  newVenues => (state.value.venues = newVenues.map(venue => venue.id)),
  { deep: true }
)

watch(
  () => supervisorsSearch.selectedPeople.value,
  newSupervisors => (state.value.supervisors = newSupervisors.map(supervisor => supervisor.id)),
  { deep: true }
)

const handleReset = () => {
  set(state, { ...initialState })
  errors.value = undefined
}

const onError = (event: FormErrorEvent) => (errors.value = event.errors)

const onSubmit = async (event: FormSubmitEvent<EventCreateType>) => {
  set(isUploading, true)

  const { surfaces, supervisors, venues, ...rest } = event.data

  const { error } = await supabase.from("events").insert(rest)

  if (error) {
    errors.value = error
    set(isUploading, false)
    return
  }

  const { error: venuesMappingError } = await supabase
    .from("event_venue_mapping")
    .insert(venues.map(venue => ({ event_id: rest.id, venue_id: venue })))

  if (venuesMappingError) errors.value += venuesMappingError

  const { error: supervisorsMappingError } = await supabase
    .from("event_supervisor_mapping")
    .insert(supervisors.map(supervisor => ({ event_id: rest.id, supervisor_id: supervisor })))

  if (supervisorsMappingError) errors.value += supervisorsMappingError

  const { error: surfacesMappingError } = await supabase
    .from("event_surface_mapping")
    .insert(surfaces.map(surface => ({ event_id: rest.id, surface_id: surface })))

  if (surfacesMappingError) errors.value += surfacesMappingError

  if (!errors.value) {
    toast.add({
      title: `${tournamentStore.name} ${year} ${event.data.tour} successfully created!`,
      description: JSON.stringify(event.data),
      icon: icons.success,
      color: "success"
    })
  }

  reloadNuxtApp()
}

const formFields = computed<FormFieldInterface<EventCreateType>[]>(() => [
  {
    label: "Tour",
    key: "tour",
    type: "radio",
    items: tournamentStore.tours,
    required: true
  },
  { label: "Level", key: "level", type: "radio", items: LEVELS, required: true },
  { label: "Dates", type: "dates", class: "col-span-2" },
  {
    label: "Sponsor Name",
    key: "sponsor_name",
    type: "text",
    class: "col-span-2"
  },
  { label: "Site Link", key: "site_link", type: "textarea", class: "col-span-2" },
  { label: "Wikipedia Link", key: "wiki_link", type: "textarea", class: "col-span-2" },
  { label: "Category", key: "category", type: "inputMenu", items: CATEGORIES, icon: ICONS.category },
  { label: "Surface", key: "surfaces", type: "inputMenu", items: SURFACE_OPTIONS, multiple: true, valueKey: "id", icon: ICONS.court },
  {
    label: "Award",
    type: "slot",
    errorPattern: /^(currency|tfc)$/,
    class: "col-span-2"
  },
  { label: "Venues", key: "venues", type: "slot", class: "col-span-2" },
  { label: "Supervisors", key: "supervisors", type: "slot", class: "col-span-2" },
  { label: "Singles Draw Type", key: "s_draw", type: "inputMenu", items: DRAWS },
  { label: "Doubles Draw Type", key: "d_draw", type: "inputMenu", items: DRAWS },
  { label: "Qualifying Singles Draw Type", key: "qs_draw", type: "inputMenu", items: DRAWS },
  { label: "Qualifying Doubles Draw Type", key: "qd_draw", type: "inputMenu", items: DRAWS },
  { label: "Singles Draw Link", key: "s_link", type: "textarea", class: "col-span-2" },
  { label: "Doubles Draw Link", key: "d_link", type: "textarea", class: "col-span-2" },
  { label: "Qualifying Singles Draw Link", key: "qs_link", type: "textarea", class: "col-span-2" },
  { label: "Qualifying Doubles Draw Link", key: "qd_link", type: "textarea", class: "col-span-2" }
])
</script>

<template>
  <u-modal
    title="Create Event"
    v-model:open="isOpen"
  >
    <u-button
      color="warning"
      :icon="icons.plus"
    />

    <template #body>
      <u-form
        id="event-form"
        :schema="EventCreateSchema"
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 items-center gap-3">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field
            v-model="state"
          >
            <u-field-group
              v-if="field.label === 'Award'"
              class="w-full"
            >
              <u-select-menu
                placeholder="e.g., $"
                :items="CURRENCY_OPTIONS"
                v-model="state.currency"
                value-key="value"
                label-key="label"
              />

              <form-input-number
                placeholder="Enter PM"
                :currency="state.currency || 'USD'"
                v-model="state.pm"
              />

              <form-input-number
                placeholder="Enter TFC"
                :currency="state.currency || 'USD'"
                v-model="state.tfc"
              />
            </u-field-group>

            <u-select-menu
              v-else-if="field.key === 'venues'"
              v-model="venueSearch.selectedVenues.value"
              :items="venueSearch.results.value"
              placeholder="Select venues"
              multiple
              :icon="ICONS.venue"
              :loading="venueSearch.loading.value"
              clear
              v-model:search-term="venueSearch.searchTerm.value"
            >
              <template #content-bottom>
                <venue-create @refresh="venueSearch.refresh" />
              </template>
            </u-select-menu>

            <u-select-menu
              v-else-if="field.key === 'supervisors'"
              v-model="supervisorsSearch.selectedPeople.value"
              :items="supervisorsSearch.results.value"
              placeholder="Select supervisors"
              multiple
              :icon="ICONS.supervisor"
              :loading="supervisorsSearch.loading.value"
              clear
              v-model:search-term="supervisorsSearch.searchTerm.value"
            >
              <template #content-bottom>
                <person-create @refresh="supervisorsSearch.refresh" />
              </template>
            </u-select-menu>
          </form-field>
        </div>
      </u-form>

      <u-alert
        v-if="errors"
        color="error"
        :title="`Error saving ${edId} ${state.tour}`"
        class="mt-5"
      >
        <template #description>
          {{ errors }}
        </template>
      </u-alert>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="event-form"
        :is-uploading
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
