<script setup lang="ts">
import { ICONS, prettifyJson, TOUR_OPTIONS, tournamentUpdateSchema } from "#imports"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { CalendarDate, parseDate } from "@internationalized/date"
import { tournamentInitialState } from "../utils"
import { snakeCase } from "change-case"

const { ui } = useAppConfig()
const supabase = useSupabaseClient()

const { tournaments, pending, searchTerm } = useTournamentSearch()

const initialState = {
  ...tournamentInitialState,
  id: undefined
}

const state = ref<Partial<TournamentUpdateInput>>({ ...initialState })
const isUpdating = ref(false)
const response = ref()
const errors = ref<Array<{ type: string; details: any }>>([])

const selectedTournament = ref<TournamentType>()

const handleTournamentSelection = async () => {
  if (selectedTournament.value) {
    set(state, {
      ...selectedTournament.value,
      abolished: selectedTournament.value.abolished ? new CalendarDate(selectedTournament.value.abolished, 1, 1) : undefined,
      established: selectedTournament.value.established ? new CalendarDate(selectedTournament.value.established, 1, 1) : undefined
    })
  }
}

watch(selectedTournament, () => handleTournamentSelection())

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

const onSubmit = async (event: FormSubmitEvent<TournamentUpdateSchema>) => {
  set(isUpdating, true)
  set(response, null)
  set(errors, [])

  try {
    // Image
    let logo_url: string | undefined

    if (event.data.logo) {
      if (event.data.logo) {
        const { error: deleteError } = await supabase.storage.from("tennis").remove([`tournaments/${deburr(snakeCase(event.data.name))}`])

        if (deleteError) {
          errors.value.push({
            type: "Error deleting tournament logo",
            details: deleteError
          })
          return
        }
      }

      // Upload to storage if a logo is selected
      const { data, error } = await supabase.storage.from("tennis").upload(`tournaments/${deburr(snakeCase(event.data.name))}`, event.data.logo, {
        cacheControl: "3600",
        upsert: true
      })

      if (error || !data) {
        errors.value.push({
          type: "Error uploading tournament logo",
          details: error
        })

        return
      }

      const { data: publicUrlData } = supabase.storage.from("tennis").getPublicUrl(data.path)

      logo_url = publicUrlData.publicUrl
    }

    const { data, error: tournamentError } = await supabase
      .schema("tennis")
      .from("tournament")
      .update({
        name: event.data.name,
        mens_id: event.data.mens_id,
        womens_id: event.data.womens_id,
        tours: event.data.tours,
        established: event.data.established?.year,
        abolished: event.data.abolished?.year,
        website: event.data.website,
        logo_url: logo_url ?? event.data.logo_url
      })
      .eq("id", event.data.id)
      .select("*")

    if (tournamentError) {
      errors.value.push({
        type: "Error updating tournament",
        details: tournamentError
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
        <div class="font-semibold">Update {{ state.name || "Tournament" }}</div>
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
        id="update-form"
        :schema="tournamentUpdateSchema"
        :state
        @submit="onSubmit"
        @error="onError"
        class="grid grid-cols-3 gap-6"
      >
        <u-form-field
          label="Logo"
          name="image"
        >
          <u-file-upload
            v-model="state.logo"
            accept="image/*"
            :label="state.logo_url ? 'Drop a replacement image here' : 'Drop your image here'"
          >
            <template
              v-if="state.logo_url"
              #leading
            >
              <img
                :src="state.logo_url"
                alt="Current logo"
                class="h-48 w-full object-contain"
              />
            </template>
          </u-file-upload>
        </u-form-field>

        <div class="col-span-2 grid grid-cols-2 gap-6">
          <form-field
            v-model="state"
            :field="{
              label: 'Name',
              key: 'name',
              type: 'text',
              required: true
            }"
          />

          <form-field
            v-model="state"
            :field="{
              label: 'Tours',
              key: 'tours',
              type: 'checkbox',
              items: TOUR_OPTIONS,
              icon: ICONS.tour,
              required: true
            }"
          />

          <form-field
            v-model="state"
            :field="{
              label: 'ATP ID',
              key: 'mens_id',
              type: 'text',
              disabled: !state.tours?.includes('ATP')
            }"
          />

          <form-field
            v-model="state"
            :field="{
              label: 'WTA ID',
              key: 'womens_id',
              type: 'text',
              disabled: !state.tours?.includes('WTA')
            }"
          />
        </div>

        <form-field
          v-model="state"
          :field="{
            label: 'Website',
            key: 'website',
            type: 'textarea'
          }"
        />

        <form-field
          v-model="state"
          :field="{
            label: 'Established',
            key: 'established',
            type: 'calendar',
            description: 'Year the tournament was established'
          }"
        />

        <form-field
          v-model="state"
          :field="{
            label: 'Abolished',
            key: 'abolished',
            type: 'calendar',
            description: 'Year the tournament was abolished'
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
        <prose-code class="w-full">
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
