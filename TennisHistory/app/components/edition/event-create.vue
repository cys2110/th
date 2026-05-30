<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { any, array, number, object, string, url, z } from "zod"

const schema = object({
  level: LevelEnum,
  tour: TourEnum.optional(),
  site_link: url(),
  wiki_link: url().optional(),
  sponsor_name: string().optional(),
  category: CategoryEnum.optional(),
  dates: any().optional(),
  currency: CurrencyEnum.optional(),
  pm: number().optional(),
  tfc: number().optional(),
  undefeated_bonus: number().optional(),
  venues: array(
    object({
      id: string(),
      label: string(),
      icon: string()
    })
  ).default([]),
  surfaces: array(string()).default([]),
  supervisors: array(
    object({
      id: string(),
      full_name: string()
    })
  ).default([]),
  s_draw: DrawsEnum.optional(),
  s_link: url().optional(),
  d_draw: DrawsEnum.optional(),
  d_link: url().optional(),
  qs_draw: DrawsEnum.optional(),
  qs_link: url().optional(),
  qd_draw: DrawsEnum.optional(),
  qd_link: url().optional()
})
type Schema = z.infer<typeof schema>

const emits = defineEmits<{ refresh: [] }>()

const {
  params: { id, edId, year }
} = useRoute("edition")

const {
  ui: { icons }
} = useAppConfig()

const toast = useToast()
const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()

const isOpen = ref(false)
const isUploading = ref(false)
const errors = ref()
const form = useTemplateRef("form")

defineShortcuts({
  ctrl_a: () => set(isOpen, !isOpen.value),
  ctrl_r: () => set(state, {}),
  ctrl_enter: () => form.value?.submit()
})

const state = ref<Partial<Schema>>({})

const handleReset = () => {
  set(state, {})
  set(errors, undefined)
}

const onError = (event: FormErrorEvent) => set(errors, event.errors)

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isUploading, true)

  try {
    const { surfaces, supervisors, venues, tour, dates, ...rest } = event.data

    const eventTour = tour || tournamentStore.tours[0]

    const eventId =
      COUNTRY_DRAWS.includes(id) ? `${edId}-Country`
      : id === "9210" ? `${edId}-LC`
      : `${edId}-${eventTour}`

    const { error } = await supabase.from("events").insert({
      ...rest,
      start_date: dates?.start?.toString() || null,
      end_date: dates?.end?.toString() || null,
      tour: eventTour,
      id: eventId,
      edition_id: Number(edId)
    })

    if (error) {
      set(errors, error)

      toast.add({
        title: `Error creating ${tournamentStore.name} ${year} ${event.data.tour}`,
        icon: icons.error,
        color: "error"
      })
    }

    const { error: venuesMappingError } = await supabase
      .from("event_venue_mapping")
      .insert(venues.map(venue => ({ event_id: eventId, venue_id: venue.id })))

    if (venuesMappingError) {
      console.error("Error adding venues", venuesMappingError)
      toast.add({
        title: "Error adding venues",
        icon: icons.error,
        color: "error"
      })
    }

    const { error: supervisorsMappingError } = await supabase
      .from("event_supervisor_mapping")
      .insert(supervisors.map(supervisor => ({ event_id: eventId, supervisor_id: supervisor.id })))

    if (supervisorsMappingError) {
      console.error("Error adding supervisors", supervisorsMappingError)
      toast.add({
        title: "Error adding supervisors",
        icon: icons.error,
        color: "error"
      })
    }

    const { error: surfacesMappingError } = await supabase
      .from("event_surface_mapping")
      .insert(surfaces.map(surface => ({ event_id: eventId, surface_id: surface })))

    if (surfacesMappingError) {
      console.error("Error adding surfaces", surfacesMappingError)
      toast.add({
        title: "Error adding surfaces",
        icon: icons.error,
        color: "error"
      })
    }

    emits("refresh")
    handleReset()
    set(isOpen, false)
  } finally {
    set(isUploading, false)
  }
}

const formFields = computed<Array<FormFieldInterface<Schema>>>(
  () =>
    [
      { label: "Dates", key: "dates", type: "dates", class: "col-span-2" },
      { label: "Sponsor Name", key: "sponsor_name", type: "text", class: "col-span-2" },
      { label: "Site Link", key: "site_link", type: "textarea", class: "col-span-2" },
      { label: "Wikipedia Link", key: "wiki_link", type: "textarea", class: "col-span-2" },
      { label: "Category", key: "category", type: "inputMenu", items: CATEGORIES, icon: ICONS.category, class: "col-span-2" },
      {
        label: "Surfaces",
        key: "surfaces",
        type: "inputMenu",
        items: SURFACE_OPTIONS,
        multiple: true,
        valueKey: "id",
        icon: ICONS.court,
        class: "col-span-2"
      },
      { label: "Venues", key: "venues", type: "slot", class: "col-span-2" },
      {
        label: "Award",
        type: "slot",
        errorPattern: /^(currency|pm|tfc|undefeated_bonus)$/,
        class: "col-span-2"
      },
      { label: "Supervisors", key: "supervisors", type: "slot", class: "col-span-2" },
      { label: "Singles Draw Type", key: "s_draw", type: "inputMenu", items: DRAWS },
      { label: "Doubles Draw Type", key: "d_draw", type: "inputMenu", items: DRAWS },
      { label: "Qualifying Singles Draw Type", key: "qs_draw", type: "inputMenu", items: DRAWS },
      { label: "Qualifying Doubles Draw Type", key: "qd_draw", type: "inputMenu", items: DRAWS },
      { label: "Singles Draw Link", key: "s_link", type: "textarea", class: "col-span-2" },
      { label: "Doubles Draw Link", key: "d_link", type: "textarea", class: "col-span-2" },
      { label: "Qualifying Singles Draw Link", key: "qs_link", type: "textarea", class: "col-span-2" },
      { label: "Qualifying Doubles Draw Link", key: "qd_link", type: "textarea", class: "col-span-2" }
    ] as Array<FormFieldInterface<Schema>>
)
</script>

<template>
  <u-modal
    title="Create Event"
    v-model:open="isOpen"
  >
    <u-button :icon="icons.plus" />

    <template #body>
      <u-alert
        v-if="errors"
        color="error"
        :title="`Error creating event ${edId}${state.tour || ''}`"
        :description="errors"
        class="mb-5"
      />

      <u-form
        id="event-form"
        ref="form"
        :schema
        :state
        @submit="onSubmit"
        @error="onError"
        class="space-y-3"
      >
        <div
          class="grid gap-3"
          :class="tournamentStore.tours.length > 1 && !COUNTRY_DRAWS.includes(id) ? 'grid-cols-2' : 'grid-cols-1'"
        >
          <form-field
            v-if="tournamentStore.tours.length > 1 && !COUNTRY_DRAWS.includes(id)"
            :field="{ label: 'Tour', key: 'tour', type: 'listbox', items: tournamentStore.tours, required: true }"
            v-model="state"
          />

          <form-field
            :field="{ label: 'Level', key: 'level', type: 'listbox', items: LEVELS, required: true }"
            v-model="state"
          />
        </div>

        <div class="grid grid-cols-2 items-center gap-3">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field
            v-model="state"
          >
            <u-field-group v-if="field.label === 'Award'">
              <u-input-menu
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
              <form-input-number
                placeholder="Enter undefeated bonus"
                :currency="state.currency || 'USD'"
                v-model="state.undefeated_bonus"
              />
            </u-field-group>

            <venue-search
              v-else-if="field.key === 'venues'"
              v-model="state[field.key]"
              multiple
              placeholder="Select venues"
            />

            <person-search
              v-else-if="field.key === 'supervisors'"
              v-model="state[field.key]"
              multiple
              placeholder="Select supervisors"
            />
          </form-field>
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="event-form"
        :loading="isUploading"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
