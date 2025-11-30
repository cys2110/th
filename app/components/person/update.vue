<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { isEqual } from "lodash"

const { person, type, refresh } = defineProps<{
  person?: PersonType
  type: "Umpire" | "Supervisor" | "Coach"
  refresh?: () => void
}>()

const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()
const open = ref(false)
const uploading = ref(false)

const initialState = {
  ...person,
  type
}

const state = ref<Partial<PersonFormSchema>>({ ...initialState })

const formFields: FormFieldInterface<PersonFormSchema>[] = [
  { label: "First Name", key: "first_name", type: "text", required: true },
  { label: "Last Name", key: "last_name", type: "text", required: true }
]

const handleReset = () => set(state, { ...initialState })

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<PersonFormSchema>) => {
  set(uploading, true)

  // Get dirty fields from the form
  const fields = Object.keys(event.data) as (keyof PersonFormSchema)[]
  const dirtyFields: Partial<PersonFormSchema> = {}
  fields.forEach(field => {
    if (!isEqual(event.data[field], initialState[field])) {
      // @ts-expect-error
      dirtyFields[field] = event.data[field]
    }
  })

  if (Object.keys(dirtyFields).length) {
    dirtyFields["id"] = event.data.id // Always include the person ID
    dirtyFields["type"] = event.data.type // Always include the person type

    const response = await $fetch(`/api/person/${person ? "update" : "create"}`, {
      method: "POST",
      body: dirtyFields
    })

    if ((response as any).ok) {
      toast.add({
        title: `${event.data.id} ${person ? "updated" : "created"}`,
        icon: icons.success,
        color: "success"
      })

      if (refresh) {
        refresh() // Refresh person details
      }

      handleReset() // Reset form
      set(open, false) // Close modal
    } else {
      toast.add({
        title: `Error ${person ? "updating" : "creating"} person`,
        icon: icons.error,
        color: "error"
      })
    }
  } else {
    toast.add({
      title: "No changes to save",
      icon: icons.caution,
      color: "warning"
    })
  }

  set(uploading, false)
}
</script>

<template>
  <u-modal
    :title="person ? (person.first_name ? `${person.first_name} ${person.last_name}` : person.id) : `Create ${type}`"
    v-model:open="open"
    :ui="{ footer: '**:rounded-md!' }"
  >
    <u-button
      :icon="person ? ICONS.edit : icons.plus"
      block
      :label="person ? (person.last_name ? `${person.first_name} ${person.last_name}` : person.id) : `Create ${type}`"
      :color="person && !person.last_name ? 'warning' : undefined"
    />

    <template #body>
      <u-form
        id="person-form"
        :schema="personFormSchema"
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
      <u-button
        form="person-form"
        type="submit"
        label="Save"
        :icon="uploading ? ICONS.uploading : icons.check"
        block
      />
      <u-button
        label="Reset"
        :icon="icons.reload"
        @click="handleReset"
        block
        color="warning"
      />
      <u-button
        label="Cancel"
        :icon="icons.error"
        @click="close"
        block
        color="error"
      />
    </template>
  </u-modal>
</template>
