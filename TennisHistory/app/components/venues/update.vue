<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { cloneDeep, isEqual } from "lodash"

const { venue, refresh } = defineProps<{
  venue?: VenueType
  refresh?: () => void
}>()

const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()
const open = ref(false)
const uploading = ref(false)

const initialState = {
  ...venue,
  country: venue?.country
    ? {
        value: venue.country.id,
        label: venue.country.name
      }
    : undefined
}

const state = ref<Partial<VenueFormInput>>(cloneDeep(initialState))

const formFields: FormFieldInterface<VenueFormSchema>[] = [
  { label: "Name", key: "name", type: "text", class: "col-span-2" },
  { label: "City", key: "city", type: "text", required: true },
  { label: "Country", key: "country", type: "search", subType: "Country", placeholder: "Countries", required: true, icon: ICONS.countries }
]

const handleReset = () => set(state, cloneDeep(initialState))

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<VenueFormSchema>) => {
  set(uploading, true)

  // Get dirty fields from the form
  const fields = Object.keys(event.data) as (keyof VenueFormSchema)[]
  const dirtyFields: Partial<VenueFormSchema> = {}
  fields.forEach(field => {
    if (!isEqual(event.data[field], initialState[field])) {
      // @ts-expect-error
      dirtyFields[field] = event.data[field] ?? null
    }
  })

  if (Object.keys(dirtyFields).length) {
    dirtyFields["id"] = event.data.id // Always include the venue ID

    const response = await $fetch(`/api/venues/${venue ? "update" : "create"}`, {
      method: "POST",
      body: dirtyFields
    })

    if ((response as any).ok) {
      toast.add({
        title: `${event.data.id} ${venue ? "updated" : "created"}`,
        icon: icons.success,
        color: "success"
      })

      if (refresh) {
        refresh() // Refresh venue details
      }

      handleReset() // Reset form
      set(open, false) // Close modal
    } else {
      toast.add({
        title: `Error ${venue ? "updating" : "creating"} venue`,
        icon: icons.error,
        color: "error"
      })
    }
  } else {
    toast.add({
      title: "No changes to save",
      icon: icons.caution,
      color: "warning"
    })
  }

  set(uploading, false)
}
</script>

<template>
  <u-modal
    v-model:open="open"
    :ui="{ footer: '**:rounded-md!' }"
  >
    <u-button
      :icon="venue ? ICONS.edit : icons.plus"
      block
    >
      <div
        v-if="venue"
        class="flex flex-wrap items-center gap-1"
      >
        <span>{{ venue.name ? `${venue.name}, ${venue.city}` : venue.city }}</span>
        <countries-link
          :country="venue.country!"
          icon-only
          class="mx-0"
        />
      </div>
      <template v-else>Create Venue</template>
    </u-button>

    <template #title>
      <div
        v-if="venue"
        class="flex flex-wrap items-center gap-1"
      >
        <span>{{ venue.name ? `${venue.name}, ${venue.city}` : venue.city }}</span>
        <countries-link
          :country="venue.country!"
          icon-only
          class="mx-0"
        />
      </div>
      <template v-else>Create Venue</template>
    </template>

    <template #body>
      <u-form
        id="venue-form"
        :schema="venueFormSchema"
        :state="state"
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 gap-3 items-center">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field="field"
            v-model="state"
          />
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <u-button
        form="venue-form"
        type="submit"
        label="Save"
        :icon="uploading ? ICONS.uploading : icons.check"
        block
      />
      <u-button
        label="Reset"
        :icon="icons.reload"
        @click="handleReset"
        block
        color="warning"
      />
      <u-button
        label="Cancel"
        :icon="icons.error"
        @click="close"
        block
        color="error"
      />
    </template>
  </u-modal>
</template>
