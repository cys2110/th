<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const { venue } = defineProps<{ venue?: VenueInterface }>()

const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()
const open = ref(false)
const uploading = ref(false)

const state = reactive<Partial<VenueInput>>({
  id: venue?.id,
  name: venue?.name,
  city: venue?.city,
  country: venue?.country
    ? {
        value: venue.country.id,
        label: venue.country.name
      }
    : undefined
})

const formFields: FormFieldInterface<VenueSchema>[] = [
  { label: "Name", key: "name", type: "text", class: "col-span-2" },
  { label: "City", key: "city", type: "text", required: true },
  { label: "Country", key: "country", type: "search", subType: "countries", required: true }
]

const handleReset = () => {
  state.name = venue?.name
  state.city = venue?.city
  state.country = venue?.country
    ? {
        value: venue.country.id,
        label: venue.country.name
      }
    : undefined
}

const onError = (event: FormErrorEvent) => {
  toast.add({
    title: "Please ensure fields are filled out correctly",
    description: event.errors.map(e => e.message).join(", "),
    icon: icons.error,
    color: "error"
  })
}

const onSubmit = async (event: FormSubmitEvent<VenueSchema>) => {
  set(uploading, true)
  try {
    const response = await $fetch(`/api/venues/${venue ? "update" : "create"}`, {
      query: event.data
    })

    if ((response as any).ok) {
      toast.add({
        title: `Venue ${venue ? "updated" : "created"}`,
        icon: icons.success,
        color: "success"
      })
      handleReset()
      set(open, false)
    } else {
      toast.add({
        title: `Error ${venue ? "updating" : "creating"} venue`,
        description: (response as any).message,
        icon: icons.error,
        color: "error"
      })
    }
  } catch (e) {
    toast.add({
      title: `Error ${venue ? "updating" : "creating"} venue`,
      description: (e as Error).message,
      icon: icons.error,
      color: "error"
    })
  } finally {
    set(uploading, false)
  }
}
</script>

<template>
  <u-modal
    :title="venue ? `Edit ${venue.name ? `${venue.name}, ${venue.city}` : venue.city}` : 'Create Venue'"
    v-model:open="open"
  >
    <u-button
      :icon="venue ? ICONS.edit : icons.plus"
      block
      size="xs"
    >
      <div
        v-if="venue"
        class="flex items-center gap-2"
      >
        <span>{{ venue.name ? `${venue.name}, ${venue.city}` : venue.city }}</span>
        <countries-link
          :country="venue.country"
          icon-only
        />
      </div>
      <template v-else>Create Venue</template>
    </u-button>

    <template #body>
      <u-form
        id="venue-form"
        :schema="venueSchema"
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 gap-5 items-center">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field="field"
            v-model="state[field.key]"
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
        @click="handleReset"
        :icon="icons.reload"
        block
        color="warning"
      />

      <u-button
        label="Cancel"
        color="error"
        @click="close"
        :icon="icons.close"
        block
      />
    </template>
  </u-modal>
</template>
