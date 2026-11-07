<script setup lang="ts">
import { CONTINENTS, countrySchema, ICONS, prettifyJson } from "#imports"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { countryInitialState } from "../utils"

const { ui } = useAppConfig()
const supabase = useSupabaseClient()

const { countries, fetchCountries } = useCountryList()

const state = ref<Partial<CountrySchema>>({ ...countryInitialState })
const isUpdating = ref(false)
const response = ref<CountryType | null>()
const error = ref<{ type: string; details: any } | null>()

const selectedCountry = ref<CountryType>()

const handleCountrySelection = (country: CountryType) => {
  set(state, { ...country })
}

const handleReset = () => {
  set(error, null)
  set(selectedCountry, null)
  set(state, { ...countryInitialState })
}

const onError = (event: FormErrorEvent) => {
  error.value = {
    type: "Validation",
    details: event.errors
  }
}

const onSubmit = async (event: FormSubmitEvent<CountrySchema>) => {
  set(isUpdating, true)
  set(response, null)
  set(error, null)

  try {
    const updatedFields = fromPairs(differenceWith(toPairs(event.data), toPairs(selectedCountry.value), isEqual)) as CountryUpdate

    const { data, error: updateError } = await supabase.schema("tennis").from("country").update(updatedFields).eq("id", event.data.id).select("*")

    if (updateError) {
      error.value = {
        type: `Error updating ${event.data.id}`,
        details: updateError.message
      }
    } else {
      fetchCountries()
      handleReset()
      set(response, data[0])
    }
  } finally {
    set(isUpdating, false)
  }
}
</script>

<template>
  <div class="flex gap-6 items-start">
    <u-card class="basis-2/3">
      <template #header>
        <div class="font-semibold">Update {{ state.name || "Country" }}</div>
      </template>

      <div class="grid grid-cols-2 gap-6">
        <u-listbox
          v-model="selectedCountry"
          v-on:update:model-value="handleCountrySelection"
          :items="countries"
          label-key="name"
          filter
        />

        <u-form
          id="update-form"
          :schema="countrySchema"
          :state
          @submit="onSubmit"
          @error="onError"
          class="space-y-3"
        >
          <u-form-field
            name="id"
            label="IOC Code"
            required
          >
            <u-input
              placeholder="IOC Code"
              v-model="state.id"
              disabled
              class="w-full"
            />
          </u-form-field>

          <u-form-field
            name="name"
            label="Name"
            required
          >
            <u-input
              placeholder="Name"
              v-model="state.name"
              class="w-full"
            />
          </u-form-field>

          <u-form-field
            name="continent"
            label="Continent"
            required
          >
            <u-select-menu
              v-model="state.continent"
              :items="[...CONTINENTS]"
              placeholder="Continent"
              class="w-full"
            />
          </u-form-field>

          <u-form-field
            name="icon"
            label="Flag"
            required
          >
            <u-input
              placeholder="Flag icon"
              v-model="state.icon"
              :icon="state.icon"
              class="w-full"
            />
          </u-form-field>
        </u-form>
      </div>

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
            :disabled="!selectedCountry"
          />

          <u-button
            color="warning"
            label="Reset"
            block
            :icon="ui.icons.reload"
            @click="handleReset"
          />

          <u-button
            color="info"
            label="Refresh Countries"
            block
            :icon="ICONS.download"
            @click="fetchCountries"
          />
        </div>
      </template>
    </u-card>

    <div class="space-y-6 basis-1/3">
      <u-alert
        v-if="error"
        color="error"
        variant="subtle"
        :title="error.type"
      >
        <template #description>
          <div v-if="Array.isArray(error.details)">
            <div
              v-for="e in error.details"
              :key="e.id"
            >
              {{ e.name }}: {{ e.message }}
            </div>
          </div>
          <div v-else>{{ error.details }}</div>
        </template>
      </u-alert>

      <u-page-card title="Request Body">
        <prose-code class="w-full">
          <pre v-html="prettifyJson(state)" />
        </prose-code>
      </u-page-card>

      <u-page-card
        v-if="response"
        title="Response"
      >
        <prose-code class="w-full">
          <pre v-html="prettifyJson(response)" />
        </prose-code>
      </u-page-card>
    </div>
  </div>
</template>
