<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { CATEGORIES, CURRENCIES, DRAW_TYPES, eventSchema, ICONS, LEVELS, prettifyJson, SURFACES, TOUR_OPTIONS } from "#imports"
import { eventInitialState } from "../utils"

const selectedEvent = defineModel<EventSelection>({ default: () => ({}) })

const { ui } = useAppConfig()
const supabase = useSupabaseClient()

const state = ref<Partial<EventInput>>({ ...eventInitialState })
const isUploading = ref(false)
const response = ref()
const errors = ref<Array<{ type: string; details: any }>>([])

watch(
  () => selectedEvent.value.edition,
  edition => {
    state.value.tour = edition?.tours.length === 1 ? edition.tours[0] : undefined
  },
  { immediate: true }
)

const handleReset = () => {
  set(state, {
    ...eventInitialState,
    supervisors: [],
    tour: selectedEvent.value.edition?.tours.length === 1 ? selectedEvent.value.edition.tours[0] : undefined
  })
  set(response, null)
  set(errors, [])
}

const onError = (event: FormErrorEvent) => {
  errors.value.push({
    type: "Validation",
    details: event.errors
  })
}

const onSubmit = async (event: FormSubmitEvent<EventSchema>) => {
  set(isUploading, true)

  try {
    const { tournament, edition } = selectedEvent.value
    if (!tournament || !edition) {
      errors.value.push({ type: "Error creating event", details: "Select a tournament and edition first." })
      return
    }

    const { surface, supervisors, venue, dates, ...rest } = event.data
    let surfaceId: string | null = null

    if (surface) {
      const { data: surfaceData, error: surfaceError } = await supabase.schema("tennis").from("surface").select("id").eq("name", surface).single()

      if (surfaceError || !surfaceData) {
        errors.value.push({
          type: "Error fetching surface",
          details: surfaceError
        })
        return
      }

      surfaceId = surfaceData.id
    }

    const { data, error } = await supabase
      .schema("tennis")
      .from("events")
      .insert({
        ...rest,
        start_date: dates?.start?.toString(),
        end_date: dates?.end?.toString(),
        edition_id: edition.id,
        surface_id: surfaceId,
        venue_id: venue?.id
      })
      .select("*")

    if (error || !data) {
      console.error(error)
      errors.value.push({
        type: "Error creating event",
        details: error
      })
      return
    }

    const eventResponse = data[0]!
    selectedEvent.value = {
      tournament,
      edition,
      event: {
        id: eventResponse.id,
        tour: eventResponse.tour as TourEnum,
        currency: eventResponse.currency
      }
    }

    const { error: supervisorsMappingError } = await supabase
      .schema("tennis")
      .from("event_supervisor_mapping")
      .insert(supervisors.map(s => ({ event_id: eventResponse!.id, supervisor_id: s.id })))

    if (supervisorsMappingError) {
      errors.value.push({
        type: "Error creating supervisor mapping",
        details: supervisorsMappingError
      })
    }

    handleReset()
    set(response, eventResponse)
  } finally {
    set(isUploading, false)
  }
}
</script>

<template>
  <div class="flex gap-6 items-start mt-6">
    <u-card class="w-2/3">
      <template #header>
        <div class="font-semibold">Create Event</div>
      </template>

      <u-form
        id="event-form"
        :schema="eventSchema"
        :state
        @submit="onSubmit"
        @error="onError"
        class="space-y-6"
      >
        <div class="grid grid-cols-3 gap-y-3 gap-x-6">
          <form-field
            v-model="state"
            :field="{
              label: 'Tour',
              key: 'tour',
              type: 'radio',
              items: selectedEvent.edition?.tours || TOUR_OPTIONS,
              required: true
            }"
          />

          <form-field
            v-model="state"
            :field="{
              label: 'Level',
              key: 'level',
              type: 'radio',
              items: LEVELS,
              required: true
            }"
          />

          <form-field
            v-model="state"
            :field="{
              label: 'Dates',
              key: 'dates',
              type: 'dates',
              class: 'row-span-4'
            }"
          />

          <form-field
            v-model="state"
            :field="{
              label: 'Sponsor Name',
              key: 'sponsor_name',
              type: 'text',
              class: 'col-span-2'
            }"
          />

          <form-field
            v-model="state"
            :field="{
              label: 'Category',
              key: 'category',
              type: 'inputMenu',
              items: CATEGORIES
            }"
          />

          <form-field
            v-model="state"
            :field="{
              label: 'Surface',
              key: 'surface',
              type: 'inputMenu',
              items: SURFACES
            }"
          />

          <form-field
            v-model="state"
            :field="{
              label: 'Venue',
              key: 'venue',
              type: 'venue',
              class: 'col-span-2'
            }"
          />

          <form-field
            v-model="state"
            :field="{
              label: 'Currency',
              key: 'currency',
              type: 'inputMenu',
              items: CURRENCIES,
              valueKey: 'value'
            }"
          />

          <form-field
            v-model="state"
            :field="{
              label: 'Prize Money',
              key: 'pm',
              type: 'number',
              currency: state.currency || 'USD',
              disabled: !state.currency
            }"
          />

          <form-field
            v-model="state"
            :field="{
              label: 'Total Financial Commitment',
              key: 'tfc',
              type: 'number',
              currency: state.currency || 'USD',
              disabled: !state.currency
            }"
          />

          <form-field
            v-model="state"
            :field="{
              label: 'Undefeated Bonus',
              key: 'undefeated_bonus',
              type: 'number',
              currency: state.currency || 'USD',
              disabled: !state.currency
            }"
          />

          <form-field
            v-model="state"
            :field="{
              label: 'Supervisors',
              key: 'supervisors',
              type: 'person',
              multiple: true,
              class: 'col-span-2'
            }"
          />
        </div>

        <u-separator label="Draws" />

        <div class="grid grid-cols-4 gap-3">
          <form-field
            v-model="state"
            :field="{
              label: 'Singles Draw Type',
              key: 's_draw',
              type: 'inputMenu',
              items: DRAW_TYPES
            }"
          />

          <form-field
            v-model="state"
            :field="{
              label: 'Singles Draw Size',
              key: 's_draw_size',
              type: 'number'
            }"
          />

          <form-field
            v-model="state"
            :field="{
              label: 'Doubles Draw Type',
              key: 'd_draw',
              type: 'inputMenu',
              items: DRAW_TYPES
            }"
          />

          <form-field
            v-model="state"
            :field="{
              label: 'Doubles Draw Size',
              key: 'd_draw_size',
              type: 'number'
            }"
          />

          <form-field
            v-model="state"
            :field="{
              label: 'Singles Draw Link',
              key: 's_draw_link',
              type: 'textarea',
              class: 'col-span-2'
            }"
          />

          <form-field
            v-model="state"
            :field="{
              label: 'Doubles Draw Link',
              key: 'd_draw_link',
              type: 'textarea',
              class: 'col-span-2'
            }"
          />

          <form-field
            v-model="state"
            :field="{
              label: 'Qualifying Singles Draw Type',
              key: 'qs_draw',
              type: 'inputMenu',
              items: DRAW_TYPES
            }"
          />

          <form-field
            v-model="state"
            :field="{
              label: 'Qualifying Singles Draw Size',
              key: 'qs_draw_size',
              type: 'number'
            }"
          />

          <form-field
            v-model="state"
            :field="{
              label: 'Qualifying Doubles Draw Type',
              key: 'qd_draw',
              type: 'inputMenu',
              items: DRAW_TYPES
            }"
          />

          <form-field
            v-model="state"
            :field="{
              label: 'Qualifying Doubles Draw Size',
              key: 'qd_draw_size',
              type: 'number'
            }"
          />

          <form-field
            v-model="state"
            :field="{
              label: 'Qualifying Singles Draw Link',
              key: 'qs_draw_link',
              type: 'textarea',
              class: 'col-span-2'
            }"
          />

          <form-field
            v-model="state"
            :field="{
              label: 'Qualifying Doubles Draw Link',
              key: 'qd_draw_link',
              type: 'textarea',
              class: 'col-span-2'
            }"
          />
        </div>
      </u-form>

      <template #footer>
        <div class="flex gap-3">
          <u-button
            form="event-form"
            color="success"
            type="submit"
            label="Create"
            block
            :icon="ui.icons.plus"
            :loading="isUploading"
            :disabled="!selectedEvent.edition"
            :loading-icon="ICONS.uploading"
          />

          <u-button
            color="warning"
            label="Reset"
            block
            :icon="ui.icons.reload"
            @click="handleReset"
          />
        </div>
      </template>
    </u-card>

    <div class="w-1/3 space-y-6">
      <u-alert
        v-if="errors.length"
        v-for="(error, index) in errors"
        :key="index"
        color="error"
        variant="subtle"
        :title="error.type"
      >
        <template #description>
          {{ prettifyJson(error.details) }}
        </template>
      </u-alert>

      <u-page-card title="Request Body">
        <prose-code class="min-w-0 w-full overflow-x-auto">
          <pre
            class="overflow-x-auto"
            v-html="prettifyJson(state)"
          />
        </prose-code>
      </u-page-card>

      <u-page-card
        v-if="response"
        title="Response"
      >
        <prose-code class="min-w-0 w-full overflow-x-auto">
          <pre
            class="overflow-x-auto"
            v-html="prettifyJson(response)"
          />
        </prose-code>
      </u-page-card>
    </div>
  </div>
</template>
