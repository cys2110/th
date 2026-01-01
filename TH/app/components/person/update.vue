<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { cloneDeep, isEqual } from "lodash"

/** Component to create or update a coach, umpire or supervisor */
const props = defineProps<{
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
  ...props.person,
  type: props.type as "Umpire" | "Supervisor" | "Coach"
}

const state = ref<Partial<PersonFormSchema>>(cloneDeep({ ...initialState }))

const handleReset = () => set(state, { ...initialState })

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<PersonFormSchema>) => {
  set(uploading, true)

  // Only include changed fields to reduce payload size
  const fields = Object.keys(event.data) as (keyof PersonFormSchema)[]
  const dirtyFields: Partial<PersonFormSchema> = {}

  // Always keep id and type
  for (const field of fields) {
    if (field === "id" || field === "type") continue

    if (!isEqual(event.data[field], initialState[field])) dirtyFields[field] = event.data[field]
  }

  if (Object.keys(dirtyFields).length) {
    const response: WriteResponseType = await $fetch(`/api/person/${props.person ? "update" : "create"}`, {
      method: "POST",
      body: dirtyFields
    })

    if (response?.success) {
      toast.add({
        title: `${event.data.id} ${props.person ? "updated" : "created"}`,
        icon: icons.success,
        color: "success"
      })

      if (props.refresh) props.refresh()

      await nextTick(() => {
        handleReset()
        set(open, false)
      })
    } else {
      toast.add({
        title: `Error ${props.person ? "updating" : "creating"} ${event.data.id}`,
        description: response?.error,
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

const formFields: FormFieldInterface<PersonFormSchema>[] = [
  { label: "First Name", key: "first_name", type: "text", required: true },
  { label: "Last Name", key: "last_name", type: "text", required: true }
]
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
      :color="person && !person.last_name ? 'warning' : 'Doubles'"
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
        :icon="uploading ? ICONS.uploading : icons.upload"
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
