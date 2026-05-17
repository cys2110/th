<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { PostgrestError } from "@supabase/supabase-js"
import { object, string, z } from "zod"

const schema = object({
  name: string().optional(),
  city: string(),
  country_id: string()
})
type Schema = z.infer<typeof schema>

const emits = defineEmits<{
  refresh: []
}>()

const {
  ui: { icons }
} = useAppConfig()

const toast = useToast()
const supabase = useSupabaseClient()

const isOpen = ref(false)
const isUploading = ref(false)
const errors = ref()

const state = ref<Partial<Schema>>({})

const handleReset = () => {
  set(state, {})
  set(errors, undefined)
}

const onError = (event: FormErrorEvent) => {
  set(errors, event.errors)
}

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isUploading, true)

  const venueName = event.data.name ? `${event.data.name}, ${event.data.city}` : event.data.city

  try {
    const { error } = await supabase.from("venues").insert(event.data)

    if (error) throw error

    toast.add({
      title: `${venueName} successfully created!`,
      icon: icons.success,
      color: "success"
    })

    emits("refresh")
    handleReset()
    set(isOpen, false)
  } catch (error) {
    set(errors, error instanceof PostgrestError ? error.details : (error as any).message)

    toast.add({
      title: `Error creating ${venueName}`,
      icon: icons.error,
      color: "error"
    })
  } finally {
    set(isUploading, false)
  }
}

const formFields = computed<FormFieldInterface<Schema>[]>(() => [
  { label: "Name", key: "name", type: "text", class: "col-span-2" },
  { label: "City", key: "city", type: "text", required: true }
])
</script>

<template>
  <u-modal
    title="Create Venue"
    v-model:open="isOpen"
  >
    <u-button
      :icon="icons.plus"
      label="Create Venue"
      block
    />

    <template #body>
      <u-form
        id="venue-form"
        :schema
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

        <u-form-field
          label="Country"
          name="country_id"
          required
          orientation="horizontal"
        >
          <country-search
            v-model="state.country_id"
            value-key
          />
        </u-form-field>
      </u-form>

      <u-alert
        v-if="errors"
        color="error"
        :title="`Error saving ${state.name ? `${state.name}, ${state.city}` : state.city}`"
        :description="errors"
        class="mt-5"
      />
    </template>

    <template #footer="{ close }">
      <form-footer
        form="venue-form"
        :loading="isUploading"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
