<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const {
  ui: { icons }
} = useAppConfig()
const toast = useToast()
const emit = defineEmits(["refresh"])

const isOpen = ref(false)
const isUploading = ref(false)

const state = ref<Partial<CountryType>>({})

const handleReset = () => set(state, {})

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<CountryType>) => {
  set(isUploading, true)

  await $fetch("/api/country/create", {
    method: "POST",
    body: event.data
  })
    .then(() => {
      toast.add({
        title: `${event.data.name} successfully created.`,
        icon: icons.success,
        color: "success"
      })

      emit("refresh")
    })
    .catch(error => {
      if (error.statusMessage) {
        console.error(error.statusMessage, error.data?.data)
      } else {
        console.error(error)
      }

      toast.add({
        title: `Error creating ${event.data.name}.`,
        description: error.statusMessage ?? "An unknown error occurred.",
        icon: icons.error,
        color: "error"
      })
    })
    .finally(() => set(isUploading, false))
}

const formFields: FormFieldInterface<CountryType>[] = [
  {
    label: "ID",
    key: "id",
    type: "text",
    required: true,
    icon: ICONS.profile
  },
  {
    label: "Name",
    key: "name",
    type: "text",
    required: true,
    icon: ICONS.globe
  },
  {
    label: "Alpha-2 Code",
    key: "alpha2",
    type: "text",
    required: false,
    icon: "icon-park-twotone:terminal",
    description: "Alpha-2 code must be exactly 2 characters."
  },
  {
    label: "Continent",
    key: "continent",
    type: "inputMenu",
    required: true,
    icon: ICONS.continent,
    items: CONTINENTS
  }
]
</script>

<template>
  <u-modal
    title="Create Country"
    v-model:open="isOpen"
  >
    <u-button
      label="Create Country"
      color="warning"
      block
      :icon="icons.plus"
    />

    <template #body>
      <!--@vue-expect-error-->
      <u-form
        id="country-form"
        :schema="countrySchema"
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 gap-3 items-center">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field
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
          form="country-form"
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
