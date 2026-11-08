<script setup lang="ts">
import { CATEGORIES, CURRENCIES, DRAW_TYPES, editionUpdateSchema, ICONS, prettifyJson, SURFACES, TOUR_OPTIONS } from "#imports"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { parseDate } from "@internationalized/date"
import { editionInitialState } from "../utils"
import type { QueryData } from "@supabase/supabase-js"

const { ui } = useAppConfig()
const supabase = useSupabaseClient()

const { tournaments, pending, searchTerm } = useTournamentSearch()

const initialState = {
  ...editionInitialState,
  id: undefined
}

const state = ref<Partial<EditionUpdateInput>>({ ...initialState })
const isUpdating = ref(false)
const response = ref()
const errors = ref<Array<{ type: string; details: any }>>([])

const selectedTournament = ref<TournamentType>()
const selectedEdition = ref<EditionOption>()

const editionQuery = () => supabase.schema("tennis").from("editions").select("*, ...surface(surface:name), venue(*)")
type EditionOption = QueryData<ReturnType<typeof editionQuery>>[number] & { label: string }

const editionOptions = ref<EditionOption[]>([])
const editionsPending = ref(false)

watch(
  () => selectedTournament.value?.id,
  async (tournamentId, _, onCleanup) => {
    let stale = false
    onCleanup(() => {
      stale = true
    })

    editionOptions.value = []
    selectedEdition.value = undefined
    state.value = { ...initialState }
    editionsPending.value = false
    if (!tournamentId) return

    editionsPending.value = true
    try {
      const { data, error } = await editionQuery().eq("tournament_id", tournamentId).order("year", { ascending: false })

      if (stale) return
      if (error) {
        errors.value.push({ type: "Error fetching editions", details: error })
        return
      }

      editionOptions.value = (data ?? []).map(edition => ({
        ...edition,
        label: `${edition.year}${edition.edition_no ? ` [${edition.edition_no}]` : ""}`
      }))
    } catch (error) {
      if (!stale) errors.value.push({ type: "Error fetching editions", details: error })
    } finally {
      if (!stale) editionsPending.value = false
    }
  }
)

const handleEditionSelection = async () => {
  if (selectedEdition.value) {
    set(state, {
      ...selectedEdition.value,
      dates:
        selectedEdition.value.start_date && selectedEdition.value.end_date ?
          {
            start_date: parseDate(selectedEdition.value.start_date),
            end_date: parseDate(selectedEdition.value.end_date)
          }
        : null
    })
  }
}

watch(selectedEdition, () => handleEditionSelection())

const handleReset = () => {
  set(errors, [])
  set(selectedTournament, null)
  set(state, { ...initialState })
}

const onError = (event: FormErrorEvent) => {
  errors.value.push({
    type: "Validation",
    details: event.errors
  })
}

const onSubmit = async (event: FormSubmitEvent<EditionUpdateSchema>) => {
  set(isUpdating, true)
  set(response, null)
  set(errors, [])

  try {
    const { id, dates, year, surface, venue, ...rest } = event.data
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
      .update({
        ...rest,
        start_date: dates?.start?.toString(),
        end_date: dates?.end?.toString(),
        surface_id: surfaceId,
        venue_id: venue?.id,
        year: year.year
      })
      .eq("id", id)

    if (error || !data) {
      errors.value.push({
        type: "Error updating edition",
        details: error
      })
      return
    }

    handleReset()
    set(response, data[0])
  } finally {
    set(isUpdating, false)
  }
}
</script>

<template>
  <div class="flex gap-6 items-start">
    <u-card class="basis-2/3">
      <template #header>
        <div class="font-semibold"
          >Update
          {{ selectedEdition ? `${selectedEdition.year}${selectedEdition.edition_no ? ` [${selectedEdition.edition_no}]` : ""}` : "Edition" }}</div
        >
      </template>

      <div class="mb-6 grid grid-cols-2 gap-6">
        <u-input-menu
          v-model="selectedTournament"
          :items="tournaments"
          v-model:search-term="searchTerm"
          :loading="pending"
          filter-ignore
          :icon="ICONS.trophy"
          placeholder="Tournament"
          label-key="name"
          class="w-full"
        />

        <u-input-menu
          v-model="selectedEdition"
          :items="editionOptions"
          :loading="editionsPending"
          placeholder="Edition"
          :disabled="!editionOptions.length"
          class="w-full"
        />
      </div>

      <u-form
        id="update-form"
        :schema="editionUpdateSchema"
        :state
        @submit="onSubmit"
        @error="onError"
        class="grid grid-cols-3 gap-6"
      >
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

        <form-field
          v-model="state"
          :field="{
            label: 'Draw Link',
            key: 'draw_link',
            type: 'textarea',
            class: 'col-span-3'
          }"
        />
      </u-form>

      <template #footer>
        <div class="flex gap-3">
          <u-button
            form="update-form"
            color="success"
            type="submit"
            label="Update"
            block
            :icon="ICONS.save"
            :loading="isUpdating"
            :loading-icon="ICONS.uploading"
            :disabled="!selectedTournament"
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

    <div class="space-y-6 w-1/3">
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
            v-html="prettifyJson(state)"
            class="overflow-x-auto"
          />
        </prose-code>
      </u-page-card>

      <u-page-card
        v-if="response"
        title="Response"
      >
        <prose-code class="min-w-0 w-full overflow-x-auto">
          <pre
            v-html="prettifyJson(response)"
            class="overflow-x-auto"
          />
        </prose-code>
      </u-page-card>
    </div>
  </div>
</template>
