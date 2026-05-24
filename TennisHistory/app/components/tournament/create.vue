<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { array, number, object, string, url, z } from "zod"

const schema = object({
  id: number("Tournament ID must be a number.").int("Tournament ID must be an integer.").positive("Tournament ID must be positive."),
  name: string().min(1, "Tournament name is required."),
  tours: array(TourEnum).default([]),
  abolished: number("Abolished year must be a number.").optional(),
  established: number("Established year must be a number.").optional(),
  website: url("Website must be a valid URL.").optional()
})
type Schema = z.infer<typeof schema>

defineShortcuts({
  ctrl_a: () => set(isOpen, !isOpen.value),
  ctrl_r: () => set(state, {}),
  ctrl_enter: () => form.value?.submit()
})

const {
  ui: { icons }
} = useAppConfig()

const router = useRouter()
const toast = useToast()
const supabase = useSupabaseClient()

const isOpen = ref(false)
const isUploading = ref(false)
const errors = ref()
const form = useTemplateRef("form")

const state = ref<Partial<Schema>>({})

const handleReset = () => {
  set(state, {})
  set(errors, undefined)
}

const onError = (event: FormErrorEvent) => set(errors, event.errors)

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isUploading, true)

  const { error } = await supabase.from("tournaments").insert(event.data)

  if (error) {
    console.error("Error creating tournament:", error)
    set(errors, error)

    toast.add({
      title: `Error creating ${event.data.name}`,
      icon: icons.error,
      color: "error"
    })
  } else {
    toast.add({
      title: `${event.data.name} successfully created!`,
      icon: icons.success,
      color: "success"
    })

    router.push({
      name: "tournament",
      params: {
        id: event.data.id,
        name: kebabCase(event.data.name)
      }
    })
  }

  set(isUploading, false)
}

const formFields: Array<FormFieldInterface<Schema>> = [
  { label: "ID", key: "id", type: "text", subType: "number", required: true },
  { label: "Tours", key: "tours", type: "checkbox", items: TOUR_OPTIONS, required: true, icon: ICONS.tour },
  { label: "Name", key: "name", type: "text", required: true, class: "col-span-2" },
  { label: "Established", key: "established", type: "text", subType: "number", description: "Year the tournament was established" },
  { label: "Abolished", key: "abolished", type: "text", subType: "number", description: "Year the tournament was abolished" },
  { label: "Website", key: "website", type: "textarea", class: "col-span-2" }
]
</script>

<template>
  <u-modal
    :title="`Create ${state.name || 'Tournament'}`"
    v-model:open="isOpen"
  >
    <u-button :icon="icons.plus" />

    <template #body>
      <u-alert
        v-if="errors"
        color="error"
        :title="`Error creating ${state.name}`"
        :description="errors"
        class="mb-5"
      />

      <u-form
        id="tournament-form"
        ref="form"
        :schema
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
    </template>

    <template #footer="{ close }">
      <form-footer
        form="tournament-form"
        :loading="isUploading"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
