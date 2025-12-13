<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import * as z from "zod"

const {
  ui: { icons }
} = useAppConfig()
const toast = useToast()
const open = ref(false)
const uploading = ref(false)

const schema = z.object({
  id: z.string("Please enter an ID"),
  tour: TourEnum
})
type Schema = z.infer<typeof schema>

const initialState = {}
const state = ref<Schema>({ ...(initialState as Schema) })

const formFields: FormFieldInterface<Schema>[] = [
  { label: "ID", key: "id", type: "text" },
  { label: "Tour", key: "tour", type: "radio", items: ["ATP", "WTA"] }
]

const handleReset = () => set(state, { ...(initialState as Schema) })

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(uploading, true)
  const response = await $fetch("/api/players/create", {
    query: event.data
  })

  if ((response as any).ok) {
    toast.add({
      title: "Player created",
      icon: icons.success,
      color: "success"
    })
    handleReset()
    set(open, false)
    await navigateTo({ name: "player", params: { id: event.data.id, name: "—" } })
  } else {
    toast.add({
      title: "Error creating player",
      description: (response as any).message,
      icon: icons.error,
      color: "error"
    })
  }

  set(uploading, false)
}
</script>

<template>
  <u-modal
    title="Create Player"
    v-model:open="open"
  >
    <u-button
      :icon="icons.plus"
      label="Create Player"
      block
    />

    <template #body>
      <u-form
        id="player-form"
        :schema="schema"
        :state
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
        form="player-form"
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
