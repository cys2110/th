<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import type { FetchError } from "ofetch"

const props = defineProps<{
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
  ...props.venue,
  country: props.venue?.country
    ? {
        value: props.venue.country.id,
        label: props.venue.country.name
      }
    : undefined
}

const state = ref<Partial<VenueFormInput>>(cloneDeep(initialState))

const handleReset = () => set(state, cloneDeep(initialState))

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<VenueFormSchema>) => {
  set(uploading, true)

  // Get dirty fields from the form
  const fields = Object.keys(event.data) as (keyof VenueFormSchema)[]
  const dirtyFields: Partial<VenueFormSchema> = {}

  for (const field of fields) {
    if (field === "id") dirtyFields[field] = event.data[field]

    if (!isEqual(event.data[field], initialState[field])) {
      // @ts-expect-error
      dirtyFields[field] = event.data[field] ?? null
    }
  }

  if (Object.keys(dirtyFields).length) {
    try {
      const response = await $fetch(`/api/venues/${props.venue ? "update" : "create"}`, {
        method: "POST",
        body: dirtyFields
      })

      if ((response as any).success) {
        toast.add({
          title: `${event.data.id} ${props.venue ? "updated" : "created"}`,
          icon: icons.success,
          color: "success"
        })

        if (props.refresh) {
          props.refresh() // Refresh venue details
        }

        await nextTick(() => {
          handleReset() // Reset form
          set(open, false) // Close modal
        })
      } else {
        toast.add({
          title: `Error ${props.venue ? "updating" : "creating"} venue`,
          icon: icons.error,
          color: "error"
        })
      }
    } catch (e) {
      if (typeof e === "object" && e && "statusMessage" in e) {
        const err = e as FetchError<ValidationError>

        if (err.statusMessage === "Invalid request body") {
          console.error(
            "Validation errors: ",
            err.data?.validationErrors.map(e => `${e.path.join(".")}: ${e.message}`)
          )
        }
      } else {
        console.error(e)
      }

      toast.add({
        title: `Error ${props.venue ? "updating" : "creating"} ${event.data.id}`,
        description: (e as Error).message,
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

const formFields: FormFieldInterface<VenueFormSchema>[] = [
  { label: "Name", key: "name", type: "text", class: "col-span-2" },
  { label: "City", key: "city", type: "text", required: true },
  { label: "Country", key: "country", type: "search", subType: "Country", placeholder: "Countries", required: true, icon: ICONS.globe }
]
</script>

<template>
  <u-modal
    v-model:open="open"
    :ui="{ footer: '**:rounded-md!' }"
  >
    <u-button
      :icon="venue ? ICONS.edit : icons.plus"
      block
      color="Doubles"
    >
      <div
        v-if="venue"
        class="flex flex-wrap items-center gap-1"
      >
        <span>{{ venue.name ? `${venue.name}, ${venue.city}` : venue.city }}</span>
        <country-link
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
        <country-link
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
        :icon="uploading ? ICONS.uploading : icons.upload"
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
