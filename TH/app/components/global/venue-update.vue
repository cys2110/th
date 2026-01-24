<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const props = defineProps<{
  venue?: VenueType
}>()

const emit = defineEmits(["refresh"])

const {
  ui: { icons }
} = useAppConfig()
const toast = useToast()

const isOpen = ref(false)
const isUploading = ref(false)

const initialState = {
  ...props.venue,
  country:
    props.venue?.country ?
      {
        value: props.venue.country.id,
        label: props.venue.country.name
      }
    : undefined
}

const state = ref<Partial<VenueFormSchema>>(cloneDeep(initialState))

const handleReset = () => set(state, cloneDeep(initialState))

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<VenueFormSchema>) => {
  set(isUploading, true)

  await $fetch(`/api/venues/${props.venue ? "update" : "create"}`, {
    method: "POST",
    body: event.data
  })
    .then(async response => {
      toast.add({
        title: `${event.data.id ?? event.data.name ?? event.data.city} ${props.venue ? "updated" : "created"}`,
        icon: icons.success,
        color: "success"
      })

      emit("refresh") // Refresh venue details

      await nextTick(() => {
        handleReset() // Reset form
        set(isOpen, false) // Close modal
      })
    })
    .catch(e => {
      if (e.statusMessage) {
        console.error(e.statusMessage, e.data?.data.validationErrors)
      } else {
        console.error(e)
      }

      toast.add({
        title: `Error ${props.venue ? "updating" : "creating"} ${event.data.id ?? event.data.name ?? event.data.city}`,
        description: e.statusMessage ?? "An unknown error occurred",
        icon: icons.error,
        color: "error"
      })
    })
    .finally(() => {
      set(isUploading, false)
    })
}

const formFields: FormFieldInterface<VenueFormSchema>[] = [
  { label: "Name", key: "name", type: "text", class: "col-span-2" },
  { label: "City", key: "city", type: "text", required: true },
  { label: "Country", key: "country", type: "search", subType: "Country", placeholder: "Countries", required: true, icon: ICONS.globe }
]
</script>

<template>
  <u-modal v-model:open="isOpen">
    <u-button
      :icon="venue ? ICONS.edit : icons.plus"
      block
      color="warning"
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
      <u-field-group>
        <u-button
          label="Save"
          color="success"
          block
          :icon="icons.upload"
          :loading="isUploading"
          :loading-icon="ICONS.uploading"
          type="submit"
          form="venue-form"
        />
        <u-button
          label="Reset"
          color="warning"
          block
          :icon="icons.reload"
          @click="handleReset"
        />
        <u-button
          label="Cancel"
          color="error"
          block
          :icon="icons.close"
          @click="close"
        />
      </u-field-group>
    </template>
  </u-modal>
</template>
