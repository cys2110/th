<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const props = defineProps<{
  person?: Partial<PersonType>
  type: "Umpire" | "Supervisor" | "Coach"
}>()

const emit = defineEmits(["refresh"])

const {
  ui: { icons }
} = useAppConfig()
const toast = useToast()

const isOpen = ref(false)
const isUploading = ref(false)

const initialState = {
  ...props.person,
  type: props.type
}

const state = ref<Partial<PersonFormSchema>>(cloneDeep(initialState))

const handleReset = () => set(state, cloneDeep(initialState))

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<PersonFormSchema>) => {
  set(isUploading, true)

  await $fetch(`/api/person/${props.person ? "update" : "create"}`, {
    method: "POST",
    body: event.data
  })
    .then(async response => {
      toast.add({
        title: `${event.data.first_name} ${event.data.last_name} ${props.person ? "updated" : "created"}`,
        icon: icons.success,
        color: "success"
      })

      emit("refresh")

      await nextTick(() => {
        handleReset() // Reset form
        set(isOpen, false) // Close modal
      })
    })
    .catch(e => {
      if (e.statusMessage === "Validation errors") {
        console.error(e.statusMessage, e.data?.data.validationErrors)
      } else {
        console.error(e)
      }

      toast.add({
        title: `Error ${props.person ? "updating" : "creating"} ${event.data.first_name} ${event.data.last_name}`,
        description: e.statusMessage ?? "An unknown error occurred",
        icon: icons.error,
        color: "error"
      })
    })
    .finally(() => {
      set(isUploading, false)
    })
}

const formFields: FormFieldInterface<PersonFormSchema>[] = [
  { label: "First Name", key: "first_name", type: "text", required: true },
  { label: "Last Name", key: "last_name", type: "text", required: true }
]
</script>

<template>
  <u-modal
    :title="person ? person.id : `Create ${type}`"
    v-model:open="isOpen"
  >
    <u-button
      :icon="person ? ICONS.edit : icons.plus"
      block
      :label="
        person ?
          person.last_name ?
            `${person.first_name} ${person.last_name}`
          : person.id
        : `Create ${type}`
      "
      :color="person && !person.last_name ? 'error' : 'warning'"
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
      <u-field-group>
        <u-button
          label="Save"
          color="success"
          block
          :icon="icons.upload"
          :loading="isUploading"
          :loading-icon="ICONS.uploading"
          type="submit"
          form="person-form"
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
