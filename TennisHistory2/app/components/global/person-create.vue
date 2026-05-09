<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

withDefaults(
  defineProps<{
    iconOnly?: boolean
  }>(),
  {
    iconOnly: false
  }
)

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

const state = ref<Partial<PersonType>>({})

const handleReset = () => {
  set(state, {})
  errors.value = undefined
}

const onError = (event: FormErrorEvent) => (errors.value = event.errors)

const onSubmit = async (event: FormSubmitEvent<PersonType>) => {
  set(isUploading, true)

  const { error } = await supabase.from("people").insert(event.data)

  if (error) {
    errors.value = error
    set(isUploading, false)
    return
  }

  toast.add({
    title: `${event.data.first_name} ${event.data.last_name} successfully created!`,
    description: JSON.stringify(event.data),
    icon: icons.success,
    color: "success"
  })

  emit("refresh")
  handleReset()
  set(isOpen, false)

  set(isUploading, false)
}

const formFields: FormFieldInterface<PersonType>[] = [
  { label: "First Name", key: "first_name", type: "text", required: true },
  { label: "Last Name", key: "last_name", type: "text", required: true }
]
</script>

<template>
  <u-modal
    title="Create Person"
    v-model:open="isOpen"
    :ui="{
      footer: '*:rounded-md!'
    }"
  >
    <u-button
      color="warning"
      :icon="icons.plus"
      :label="iconOnly ? undefined : 'Create Person'"
      block
    />

    <template #body>
      <u-form
        id="person-form"
        :schema="PersonSchema"
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
        class="mt-5"
      >
        <template #description>
          {{ errors }}
        </template>
      </u-alert>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="person-form"
        :is-uploading
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
