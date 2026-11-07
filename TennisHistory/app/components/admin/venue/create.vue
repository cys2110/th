<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent, ListboxItem } from "@nuxt/ui"
import { ICONS, isDefined, prettifyJson, venueSchema } from "#imports"

const { ui } = useAppConfig()
const supabase = useSupabaseClient()

const { countries } = useCountryList()

const initialState = {
  name: undefined,
  city: undefined,
  country: undefined
}

const state = ref<Partial<VenueSchema>>({ ...initialState })
const isUploading = ref(false)
const response = ref()
const error = ref<{ type: string; details: any } | null>()

const handleReset = () => {
  set(state, { ...initialState })
  set(response, null)
  set(error, null)
}

const onError = (event: FormErrorEvent) => {
  error.value = {
    type: "Validation",
    details: event.errors
  }
}

const onSubmit = async (event: FormSubmitEvent<VenueSchema>) => {
  set(isUploading, true)
  set(response, null)
  set(error, null)

  const { country, ...rest } = event.data

  try {
    const { data, error: insertError } = await supabase
      .schema("tennis")
      .from("venue")
      .insert({
        ...rest,
        country_id: country.id
      })
      .select("*")

    if (insertError) {
      error.value = {
        type: `Error creating ${rest.name || rest.city}`,
        details: insertError.message
      }
    } else {
      handleReset()
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
        <div class="font-semibold">Create Venue</div>
      </template>

      <u-form
        id="venue-form"
        :schema="venueSchema"
        :state
        @submit="onSubmit"
        @error="onError"
        class="grid grid-cols-2 gap-6"
      >
        <div class="space-y-3">
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
            name="city"
            label="City"
            required
          >
            <u-input
              placeholder="City"
              v-model="state.city"
              class="w-full"
            >
              <template
                #trailing
                v-if="isDefined(state.city)"
              >
                <u-button
                  color="neutral"
                  variant="link"
                  :icon="ui.icons.close"
                  @click="state.city = undefined"
                />
              </template>
            </u-input>
          </u-form-field>
        </div>

        <u-form-field
          name="country"
          label="Country"
          required
        >
          <u-listbox
            :items="countries"
            label-key="name"
            v-model="state.country"
            filter
          />
        </u-form-field>
      </u-form>

      <template #footer>
        <div class="flex gap-3">
          <u-button
            form="venue-form"
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
