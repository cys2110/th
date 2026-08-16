<script setup lang="ts">
import { any, object, string, z } from "zod"
import { set } from "@vueuse/core"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const schema = object({
  person: object({ id: string() }),
  title: CoachRoleEnum,
  start_date: any().optional(),
  end_date: any().optional()
})
type Schema = z.infer<typeof schema>

defineShortcuts({
  ctrl_a: () => set(isOpen, !isOpen.value)
})

const emits = defineEmits<{ refresh: [] }>()

const route = useRoute("team")
const toast = useToast()
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const isOpen = ref(false)
const isSaving = ref(false)
const errors = ref()

const state = ref<Partial<Schema>>({})

const handleReset = () => {
  set(state, {})
  set(errors, undefined)
}

const onError = (event: FormErrorEvent) => set(errors, JSON.stringify(event.errors))

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isSaving, true)

  try {
    const { error } = await supabase.schema("football").from("team_coach_tenure").insert({
      team_id: route.params.id,
      person_id: event.data.person.id,
      title: event.data.title,
      start_date: event.data.start_date?.toString(),
      end_date: event.data.end_date?.toString()
    })

    if (error) {
      throw new Error(`Error creating coach: ${error.message}`)
    }

    handleReset()
    emits("refresh")
    set(isOpen, false)
  } catch (error) {
    console.error(error)
    set(errors, error)
    toast.add({
      title: "Error creating coach",
      icon: ui.icons.error,
      color: "error"
    })
  } finally {
    set(isSaving, false)
  }
}

const formFields: Array<FormFieldInterface<Schema>> = [
  { label: "Person", key: "person", type: "person" },
  {
    label: "Title",
    key: "title",
    type: "inputMenu",
    items: COACH_ROLES,
    required: true,
    valueKey: "value"
  },
  { label: "Start Date", key: "start_date", type: "date" },
  { label: "End Date", key: "end_date", type: "date" }
]
</script>

<template>
  <u-modal
    v-model:open="isOpen"
    title="Create Coach"
  >
    <u-button :icon="ui.icons.plus" />

    <template #body>
      <u-alert
        v-if="errors"
        color="error"
        title="Error creating coach"
        :description="errors"
        class="mb-5"
      />

      <u-form
        id="coach-form"
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
        form="coach-form"
        :loading="isSaving"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
