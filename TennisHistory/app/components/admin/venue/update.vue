<script setup lang="ts">
import { ICONS, prettifyJson, venueUpdateSchema } from "#imports"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const { ui } = useAppConfig()
const supabase = useSupabaseClient()

const { countries } = useCountryList()

const initialState = {
  id: undefined,
  name: undefined,
  city: undefined,
  country: undefined
}

const state = ref<Partial<VenueUpdateSchema>>({ ...initialState })
const isUpdating = ref(false)
const response = ref<VenueType | null>()
const error = ref<{ type: string; details: any } | null>()

const selectedVenue = ref<VenueType>()

const handleVenueSelection = () => {
  if (selectedVenue.value) {
    const { country_id, icon, ...rest } = selectedVenue.value
    const selectedCountry = countries.value.find(c => (c.id = country_id))!
    set(state, { ...rest, country: selectedCountry })
  }
}

watch(selectedVenue, () => handleVenueSelection())

const handleReset = () => {
  set(error, null)
  set(selectedVenue, null)
  set(state, { ...initialState })
}

const onError = (event: FormErrorEvent) => {
  error.value = {
    type: "Validation",
    details: event.errors
  }
}

const onSubmit = async (event: FormSubmitEvent<VenueUpdateSchema>) => {
  set(isUpdating, true)
  set(response, null)
  set(error, null)

  try {
    const updatedFields = fromPairs(differenceWith(toPairs(event.data), toPairs(selectedVenue.value), isEqual)) as VenueUpdate

    const { data, error: updateError } = await supabase
      .schema("tennis")
      .from("venue")
      .update(updatedFields)
      .eq("id", event.data.id)
      .select("*, ...country(icon)")

    if (updateError) {
      error.value = {
        type: `Error updating ${event.data.id}`,
        details: updateError.message
      }
    } else {
      handleReset()
      set(response, data[0] as VenueType)
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
        <div class="font-semibold">Update {{ state.name || state.city || "Venue" }}</div>
      </template>

      <u-form
        id="update-form"
        :schema="venueUpdateSchema"
        :state
        @submit="onSubmit"
        @error="onError"
        class="grid grid-cols-2 gap-6"
      >
        <div class="space-y-3">
          <venue-search v-model="selectedVenue" />

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
            name="city"
            label="City"
            required
          >
            <u-input
              placeholder="City"
              v-model="state.city"
              class="w-full"
            />
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
            form="update-form"
            color="success"
            type="submit"
            label="Update"
            block
            :icon="ICONS.save"
            :loading="isUpdating"
            :loading-icon="ICONS.uploading"
            :disabled="!selectedVenue"
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
