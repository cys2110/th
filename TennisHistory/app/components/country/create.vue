<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const {
  ui: { icons }
} = useAppConfig()

const toast = useToast()
const supabase = useSupabaseClient()

const emit = defineEmits<{
  refresh: []
}>()

const isOpen = ref(false)
const isUploading = ref(false)

const errors = ref()

const state = ref<Partial<CountryType>>({})

const handleReset = () => {
  set(state, {})
  errors.value = undefined
}

const onError = (event: FormErrorEvent) => (errors.value = event.errors)

const onSubmit = async (event: FormSubmitEvent<CountryType>) => {
  set(isUploading, true)

  const { error } = await supabase.from("countries").insert(event.data)

  if (error) {
    errors.value = error
    set(isUploading, false)
    return
  }

  toast.add({
    title: `${event.data.name} successfully created!`,
    description: JSON.stringify(event.data),
    icon: icons.success,
    color: "success"
  })

  emit("refresh")
  handleReset()
  set(isOpen, false)
  set(isUploading, false)
}

const formFields: FormFieldInterface<CountryType>[] = [
  {
    label: "ID",
    key: "id",
    type: "text",
    required: true
  },
  {
    label: "Name",
    key: "name",
    type: "text",
    required: true
  },
  {
    label: "Alpha-2 Code",
    key: "alpha_2",
    type: "text",
    required: false,
    description: "Alpha-2 code must be exactly 2 characters."
  },
  {
    label: "Continent",
    key: "continent",
    type: "inputMenu",
    required: true,
    icon: ICONS.world,
    items: CONTINENTS
  }
]
</script>

<template>
  <u-modal
    :title="`Create ${state.name || 'Country'}`"
    v-model:open="isOpen"
  >
    <u-button
      color="warning"
      :icon="icons.plus"
    />

    <template #body>
      <u-form
        id="country-form"
        :schema="CountrySchema"
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 items-center gap-3">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field
            v-model="state"
          />
        </div>
      </u-form>

      <u-alert
        v-if="errors"
        color="error"
        :title="`Error saving ${state.name}`"
        class="mt-5"
      >
        <template #description>
          {{ errors }}
        </template>
      </u-alert>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="country-form"
        :is-uploading
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
