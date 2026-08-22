<script setup lang="ts">
import { any, object, string, z } from "zod"
import { set } from "@vueuse/core"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const schema = object({
  first_name: string().min(1, "First name is required"),
  last_name: string().min(1, "Last name is required"),
  dob: any().optional(),
  dod: any().optional(),
  nationality: object({ id: string() }).optional(),
  birth_place: string().optional(),
  birth_country: object({ id: string() }).optional()
})
type Schema = z.infer<typeof schema>

defineShortcuts({
  ctrl_a: () => set(isOpen, !isOpen.value)
})

const emits = defineEmits<{ refresh: [] }>()

const toast = useToast()
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const isOpen = ref(false)
const isSaving = ref(false)

const state = ref<Partial<Schema>>({})

const handleReset = () => {
  set(state, {})
}

const onError = (event: FormErrorEvent) => {
  toast.add({
    title: "Validation error",
    icon: ui.icons.error,
    color: "error"
  })
  console.error("Validation error:", event)
}

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isSaving, true)

  try {
    const { nationality, birth_country, dob, dod, ...rest } = event.data

    const { error } = await supabase
      .schema("tennis")
      .from("people")
      .insert({
        ...rest,
        nationality_id: nationality?.id,
        birth_country_id: birth_country?.id,
        dob: dob?.toString(),
        dod: dod?.toString()
      })

    if (error) {
      console.error("Error creating person:", error)
      throw Error
    }

    toast.add({
      title: `${event.data.first_name} ${event.data.last_name} successfully created!`,
      icon: ui.icons.success,
      color: "success"
    })

    handleReset()
    emits("refresh")
    set(isOpen, false)
  } catch (error) {
    toast.add({
      title: `Error creating ${event.data.first_name} ${event.data.last_name}`,
      icon: ui.icons.error,
      color: "error"
    })
  } finally {
    set(isSaving, false)
  }
}

const formFields: Array<FormFieldInterface<Schema>> = [
  { label: "First Name", key: "first_name", type: "text", required: true },
  { label: "Last Name", key: "last_name", type: "text", required: true },
  { label: "Nationality", key: "nationality", type: "country", class: "col-span-2" },
  { label: "Date of Birth", key: "dob", type: "date" },
  { label: "Date of Death", key: "dod", type: "date" },
  { label: "Birth Place", key: "birth_place", type: "text" },
  { label: "Country of Birth", key: "birth_country", type: "country" }
]
</script>

<template>
  <u-modal
    v-model:open="isOpen"
    :title="`Create ${state.first_name ? `${state.first_name} ${state.last_name || ''}` : 'Person'}`"
  >
    <u-button
      :icon="ui.icons.plus"
      block
      size="xs"
      label="Create Person"
    />

    <template #body>
      <u-form
        id="person-form"
        :schema
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 items-center gap-3">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            v-model="state"
            :field
          />
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="person-form"
        :loading="isSaving"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
