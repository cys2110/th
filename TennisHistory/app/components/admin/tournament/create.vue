<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { ICONS, prettifyJson, TOUR_OPTIONS, tournamentSchema } from "#imports"
import { tournamentInitialState } from "../utils"
import { snakeCase } from "change-case"

const { ui } = useAppConfig()
const supabase = useSupabaseClient()

const state = ref<Partial<TournamentInputSchema>>({ ...tournamentInitialState })
const isUploading = ref(false)
const response = ref()
const errors = ref<Array<{ type: string; details: any }>>([])
const imageUrl = ref<string | null>(null)

const handleReset = () => {
  set(state, { ...tournamentInitialState })
  set(response, null)
  set(errors, [])
  set(imageUrl, null)
}

const onError = (event: FormErrorEvent) => {
  errors.value.push({
    type: "Validation",
    details: event.errors
  })
}

const onSubmit = async (event: FormSubmitEvent<TournamentSchema>) => {
  set(isUploading, true)

  try {
    const { abolished, established, logo, ...rest } = event.data

    let logo_url: string | undefined

    // Upload to storage if a logo is selected
    if (logo) {
      const { data, error } = await supabase.storage.from("tennis").upload(`tournaments/${deburr(snakeCase(rest.name))}`, logo, {
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

    const { data, error } = await supabase
      .schema("tennis")
      .from("tournament")
      .insert({ ...rest, abolished: abolished?.year, established: established?.year, logo_url })
      .select("*")

    if (error || !data) {
      errors.value.push({
        type: "Error creating tournament",
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
        <div class="font-semibold">Create Tournament</div>
      </template>

      <u-form
        id="tournament-form"
        :schema="tournamentSchema"
        :state
        @submit="onSubmit"
        @error="onError"
        class="grid grid-cols-3 gap-6"
      >
        <form-field
          v-model="state"
          :field="{
            label: 'Logo',
            key: 'image',
            type: 'image'
          }"
        />

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
            form="tournament-form"
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
