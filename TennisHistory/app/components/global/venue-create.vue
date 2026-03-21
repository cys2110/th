<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const {
  ui: { icons }
} = useAppConfig()

const toast = useToast()

const emit = defineEmits<{
  refresh: []
}>()

const supabase = useSupabaseClient()

const isOpen = ref(false)
const isUploading = ref(false)
const errors = ref()

const { data: countries, pending } = await useAsyncData(
  "countries",
  async () => {
    const { data, error } = await supabase.from("countries").select("*").order("name", { ascending: true })

    if (error || !data) {
      console.error("Error fetching countries:", error)
      return []
    }

    return data.map(country => ({
      ...country,
      icon: getFlagCode(country)
    }))
  },
  { default: () => [] }
)

const state = ref<Partial<VenueType>>({})

const handleReset = () => {
  set(state, {})
  errors.value = undefined
}

const onError = (event: FormErrorEvent) => (errors.value = event.errors)

const onSubmit = async (event: FormSubmitEvent<VenueType>) => {
  set(isUploading, true)

  const { error } = await supabase.from("venues").insert(event.data)

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

const formFields = computed<FormFieldInterface<VenueType>[]>(() => [
  { label: "Name", key: "name", type: "text", class: "col-span-2" },
  { label: "City", key: "city", type: "text", required: true },
  {
    label: "Country",
    key: "country_id",
    type: "inputMenu",
    required: true,
    valueKey: "id",
    icon: ICONS.globe,
    loading: pending.value,
    items: countries.value,
    labelKey: "name"
  }
])
</script>

<template>
  <u-modal
    v-model:open="isOpen"
    title="Create Venue"
  >
    <u-button
      color="warning"
      :icon="icons.plus"
      label="Create Venue"
      block
    />

    <template #body>
      <u-form
        id="venue-form"
        :schema="VenueSchema"
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <form-field
          v-for="field in formFields"
          :key="field.label"
          :field
          v-model="state"
          orientation="horizontal"
        />
      </u-form>

      <u-alert
        v-if="errors"
        color="error"
        :title="`Error saving ${state.name || state.city}`"
        class="mt-5"
      >
        <template #description>
          {{ errors }}
        </template>
      </u-alert>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="venue-form"
        :is-uploading
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
