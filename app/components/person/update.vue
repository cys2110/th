<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
const { person, type, refresh } = defineProps<{
  person?: PersonInterface
  type: "Umpire" | "Supervisor" | "Coach"
  refresh?: () => void
}>()

const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()
const open = ref(false)
const uploading = ref(false)

const state = reactive<Partial<PersonSchema>>({
  ...person,
  type
})

const formFields: FormFieldInterface<PersonSchema>[] = [
  { label: "First Name", key: "first_name", type: "text" },
  { label: "Last Name", key: "last_name", type: "text" }
]

const handleReset = () => {
  state.id = person?.id
  state.first_name = person?.first_name
  state.last_name = person?.last_name
}

const onError = (event: FormErrorEvent) => {
  console.error(event.errors)
  toast.add({
    title: "Please ensure fields are filled out correctly",
    description: event.errors.map(e => e.message).join(", "),
    icon: icons.error,
    color: "error"
  })
}

const onSubmit = async (event: FormSubmitEvent<PersonSchema>) => {
  set(uploading, true)
  try {
    const response = await $fetch(`/api/person/${person ? "update" : "create"}`, {
      query: event.data
    })

    if ((response as any).ok) {
      toast.add({
        title: `${type} ${person ? "updated" : "created"}`,
        icon: icons.success,
        color: "success"
      })
      handleReset()
      if (refresh) {
        refresh()
      }
      set(open, false)
    } else {
      toast.add({
        title: `Error ${person ? "updating" : "creating"} ${type}`,
        description: (response as any).message,
        icon: icons.error,
        color: "error"
      })
    }
  } catch (e) {
    toast.add({
      title: `Error ${person ? "updating" : "creating"} ${type}`,
      description: (e as Error).message,
      icon: icons.error,
      color: "error"
    })
  } finally {
    set(uploading, false)
  }
}
</script>

<template>
  <u-modal
    :title="person ? `Edit ${person.last_name ? `${person.first_name} ${person.last_name}` : person.id}` : `Create ${type}`"
    v-model:open="open"
    :ui="{ footer: '*:rounded-md!' }"
  >
    <u-button
      :icon="person ? ICONS.edit : icons.plus"
      block
      size="xs"
      :label="person ? `Edit ${person.last_name ? `${person.first_name} ${person.last_name}` : person.id}` : `Create ${type}`"
      :color="person && !person.last_name ? 'warning' : undefined"
    />

    <template #body>
      <u-form
        id="person-form"
        :schema="personSchema"
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 gap-5 items-center **:rounded-md!">
          <form-input
            v-for="field in formFields"
            :key="field.label"
            v-model="(state[field.key] as string)"
            :placeholder="field.label"
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
        @click="handleReset"
        :icon="icons.reload"
        block
        color="warning"
      />
      <u-button
        label="Cancel"
        color="error"
        @click="close"
        :icon="icons.close"
        block
      />
    </template>
  </u-modal>
</template>
