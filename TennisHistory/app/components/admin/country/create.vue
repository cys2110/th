<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent, ListboxItem } from "@nuxt/ui"
import { countrySchema, ICONS, isDefined, prettifyJson } from "#imports"
import { countryInitialState } from "../utils"

const { ui } = useAppConfig()
const supabase = useSupabaseClient()

const { countries, fetchCountries } = useCountryList()

const continents: Array<ListboxItem> = [
  { value: "Africa" },
  { value: "Asia" },
  { value: "Europe" },
  { value: "North America" },
  { value: "Oceania" },
  { value: "South America" }
]

const state = ref<Partial<CountrySchema>>({ ...countryInitialState })
const isUploading = ref(false)
const response = ref()
const error = ref<{ type: string; details: any } | null>()

const existingCountry = computed(() => countries.value.find(c => c.id === state.value.id || c.name === state.value.name))

const handleReset = () => {
  set(state, { ...countryInitialState })
  set(response, null)
  set(error, null)
}

const onError = (event: FormErrorEvent) => {
  error.value = {
    type: "Validation",
    details: event.errors
  }
}

const onSubmit = async (event: FormSubmitEvent<CountrySchema>) => {
  set(isUploading, true)
  set(response, null)
  set(error, null)

  try {
    const { data, error: insertError } = await supabase.schema("tennis").from("country").insert(event.data).select("*")

    if (insertError) {
      error.value = {
        type: `Error creating ${event.data.name}`,
        details: insertError.message
      }
    } else {
      handleReset()
      fetchCountries()
      set(response, data[0])
    }
  } finally {
    set(isUploading, false)
  }
}
</script>

<template>
  <div class="flex gap-6 items-start">
    <u-card class="basis-2/3">
      <template #header>
        <div class="font-semibold">Create Country</div>
      </template>

      <u-form
        id="country-form"
        :schema="countrySchema"
        :state
        @submit="onSubmit"
        @error="onError"
        class="grid grid-cols-2 gap-6"
      >
        <div class="space-y-3">
          <u-form-field
            name="id"
            label="IOC Code"
            required
          >
            <u-input
              placeholder="IOC Code"
              v-model="state.id"
              class="w-full"
            >
              <template
                #trailing
                v-if="isDefined(state.id)"
              >
                <u-button
                  color="neutral"
                  variant="link"
                  :icon="ui.icons.close"
                  @click="state.id = undefined"
                />
              </template>
            </u-input>
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
            >
              <template
                #trailing
                v-if="isDefined(state.name)"
              >
                <u-button
                  color="neutral"
                  variant="link"
                  :icon="ui.icons.close"
                  @click="state.name = undefined"
                />
              </template>
            </u-input>
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
            >
              <template
                #trailing
                v-if="isDefined(state.icon)"
              >
                <u-button
                  color="neutral"
                  variant="link"
                  :icon="ui.icons.close"
                  @click="state.icon = undefined"
                />
              </template>
            </u-input>
          </u-form-field>
        </div>

        <u-form-field
          name="continent"
          label="Continent"
          required
        >
          <u-listbox
            :items="continents"
            label-key="value"
            value-key="value"
            v-model="state.continent"
          />
        </u-form-field>
      </u-form>

      <template #footer>
        <div class="flex gap-3">
          <u-button
            form="country-form"
            color="success"
            type="submit"
            label="Create"
            block
            :icon="ui.icons.plus"
            :loading="isUploading"
            :loading-icon="ICONS.uploading"
            :disabled="!!existingCountry"
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
        v-if="existingCountry"
        color="warning"
        variant="subtle"
        title="This country already exists!"
        :icon="ui.icons.caution"
      >
        <template #description>
          <country-link :country="existingCountry" />
        </template>
      </u-alert>

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
