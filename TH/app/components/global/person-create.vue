<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { PostgrestError } from "@supabase/supabase-js"
import { object, string, z } from "zod"

const schema = object({
  first_name: string(),
  last_name: string()
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

  try {
    const { error } = await supabase.from("people").insert(event.data)

    if (error) throw error

    toast.add({
      title: `${event.data.first_name} ${event.data.last_name} successfully created!`,
      icon: icons.success,
      color: "success"
    })

    emits("refresh")
    handleReset()
    set(isOpen, false)
  } catch (error) {
    set(errors, error instanceof PostgrestError ? error.details : (error as any).message)

    toast.add({
      title: `Error creating ${event.data.first_name} ${event.data.last_name}`,
      icon: icons.error,
      color: "error"
    })
  } finally {
    set(isUploading, false)
  }
}

const formFields = computed<FormFieldInterface<Schema>[]>(() => [
  { label: "First Name", key: "first_name", type: "text", required: true },
  { label: "Last Name", key: "last_name", type: "text", required: true }
])
</script>

<template>
  <u-modal
    title="Create Person"
    v-model:open="isOpen"
  >
    <u-button
      :icon="icons.plus"
      label="Create Person"
      block
    />

    <template #body>
      <u-form
        id="person-form"
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
      </u-form>

      <u-alert
        v-if="errors"
        color="error"
        :title="`Error saving ${state.first_name} ${state.last_name}`"
        :description="errors"
        class="mt-5"
      />
    </template>

    <template #footer="{ close }">
      <form-footer
        form="person-form"
        :loading="isUploading"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
