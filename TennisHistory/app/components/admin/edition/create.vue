<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { CATEGORIES, CURRENCIES, DRAW_TYPES, editionSchema, ICONS, prettifyJson, SURFACES, TOUR_OPTIONS } from "#imports"
import { editionInitialState } from "../utils"

const { ui } = useAppConfig()
const supabase = useSupabaseClient()

const { tournaments, pending, searchTerm } = useTournamentSearch()

const state = ref<Partial<EditionInput>>({ ...editionInitialState })
const isUploading = ref(false)
const response = ref()
const errors = ref<Array<{ type: string; details: any }>>([])

const selectedTournament = ref<TournamentType>()

watch(selectedTournament, () => {
  if (selectedTournament.value?.tours.length === 1) {
    state.value.tours = selectedTournament.value.tours
  }
})

const handleReset = () => {
  set(state, { ...editionInitialState, tours: [] })
  set(response, null)
  set(errors, [])
}

const onError = (event: FormErrorEvent) => {
  errors.value.push({
    type: "Validation",
    details: event.errors
  })
}

const onSubmit = async (event: FormSubmitEvent<EditionSchema>) => {
  set(isUploading, true)

  try {
    const { dates, year, surface, venue, ...rest } = event.data
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
      .from("editions")
      .insert({
        ...rest,
        tournament_id: selectedTournament.value!.id,
        start_date: dates?.start?.toString(),
        end_date: dates?.end?.toString(),
        surface_id: surfaceId,
        venue_id: venue?.id,
        year: year.year
      })
      .select("*")

    if (error || !data) {
      console.error(error)
      errors.value.push({
        type: "Error creating edition",
        details: error
      })
      return
    }

    handleReset()
    set(response, data[0])
  } finally {
    set(isUploading, false)
  }
}
</script>

<template>
  <div class="flex gap-6 items-start">
    <u-card class="w-2/3">
      <template #header>
        <div class="font-semibold">Create Edition</div>
      </template>

      <u-input-menu
        v-model="selectedTournament"
        :items="tournaments"
        v-model:search-term="searchTerm"
        :loading="pending"
        filter-ignore
        :icon="ICONS.trophy"
        placeholder="Tournament"
        label-key="name"
        class="mb-6 w-full"
      />

      <u-form
        id="edition-form"
        :schema="editionSchema"
        :state
        @submit="onSubmit"
        @error="onError"
        class="grid grid-cols-3 gap-y-3 gap-x-6"
      >
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
            label: 'Dates',
            key: 'dates',
            type: 'dates',
            class: 'row-span-3'
          }"
        />

        <div class="space-y-3">
          <form-field
            v-if="!selectedTournament || selectedTournament.tours.length > 1"
            v-model="state"
            :field="{
              label: 'Tours',
              key: 'tours',
              type: 'checkbox',
              items: selectedTournament?.tours || TOUR_OPTIONS,
              icon: ICONS.tour,
              required: true
            }"
          />

          <form-field
            v-model="state"
            :field="{
              label: 'Edition Number',
              key: 'edition_no',
              type: 'number',
              required: true
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
        </div>

        <form-field
          v-model="state"
          :field="{
            label: 'Year',
            key: 'year',
            type: 'calendar',
            class: 'row-span-1'
          }"
          required
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
            type: 'venue'
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
            label: 'Draw Link',
            key: 'draw_link',
            type: 'textarea',
            class: 'row-span-2'
          }"
        />

        <form-field
          v-model="state"
          :field="{
            label: 'Draw Type',
            key: 'draw_type',
            type: 'inputMenu',
            items: DRAW_TYPES
          }"
        />

        <form-field
          v-model="state"
          :field="{
            label: 'Draw Size',
            key: 'draw_size',
            type: 'number'
          }"
        />
      </u-form>

      <template #footer>
        <div class="flex gap-3">
          <u-button
            form="edition-form"
            color="success"
            type="submit"
            label="Create"
            block
            :icon="ui.icons.plus"
            :loading="isUploading"
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
