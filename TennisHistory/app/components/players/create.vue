<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import * as z from "zod"

const {
  ui: { icons }
} = useAppConfig()
const toast = useToast()
const router = useRouter()

const open = ref(false)
const uploading = ref(false)

const schema = z.object({
  id: z.string("Please enter an ID"),
  tour: TourInputEnum
})
type Schema = z.infer<typeof schema>

const initialState = {}
const state = ref<Schema>({ ...(initialState as Schema) })

const handleReset = () => set(state, { ...(initialState as Schema) })

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(uploading, true)

  const response = await $fetch("/api/players/create", {
    query: event.data
  })

  if (response.success) {
    toast.add({
      title: `${event.data.id} created successfully`,
      icon: icons.success,
      color: "success"
    })

    handleReset()
    set(open, false)

    router.push({ name: "player", params: { id: event.data.id, name: "—" } })
  } else {
    toast.add({
      title: "Error creating player",
      icon: icons.error,
      color: "error"
    })
  }
}

const formFields: (FormFieldInterface<Schema> & { key: keyof Schema })[] = [
  { label: "ID", key: "id", type: "text", required: true },
  { label: "Tour", key: "tour", type: "radio", items: ["ATP", "WTA"], required: true }
]
</script>

<template>
  <u-modal
    :title="`Create ${state.id ?? 'Player'}`"
    v-model:open="open"
  >
    <u-button
      :icon="icons.plus"
      label="Create Player"
      color="Doubles"
      block
    />

    <template #body>
      <u-form
        id="player-form"
        :schema="schema"
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
        form="player-form"
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
