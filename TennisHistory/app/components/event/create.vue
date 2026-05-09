<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { any, array, number, object, string, url, z } from "zod"

const schema = object({
  id: string(),
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
  venues: array(
    object({
      id: string,
      label: string,
      icon: string
    })
  ).default([]),
  surfaces: array(string()).default([]),
  supervisors: array(
    object({
      id: string(),
      label: string()
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
const form = useTemplateRef("form")

defineShortcuts({
  ctrl_e: () => set(isOpen, !isOpen.value),
  ctrl_r: () => set(state, {}),
  ctrl_enter: () => form.value?.submit()
})

const state = ref<Partial<Schema>>({})

const handleReset = () => {
  set(state, {})
  set(errors, undefined)
}

const onError = (event: FormErrorEvent) => {
  set(errors, event.errors)
}

const onSubmit = async (event: FormSubmitEvent<Schema>) => {}

const formFields = computed<Array<FormFieldInterface<Schema>>>(
  () =>
    [
      ...(tournamentStore.tours.length > 1 ? [{ label: "Tour", key: "tour", type: "radio", items: tournamentStore.tours, required: true }] : []),
      { label: "Level", key: "level", type: "radio", items: LEVELS, required: true },
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
      <u-form
        id="event-form"
        ref="form"
        :schema
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
            <u-field-group v-if="field.label === 'Award'">
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

            <!-- <u-select-menu
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
            </u-select-menu> -->
          </form-field>
        </div>
      </u-form>

      <u-alert
        v-if="errors"
        color="error"
        :title="`Error creating event ${edId}${state.tour || ''}`"
        :description="errors"
        class="mt-5"
      />
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
