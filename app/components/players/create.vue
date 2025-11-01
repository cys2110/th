<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import * as z from "zod"

const {
  ui: { icons }
} = useAppConfig()
const toast = useToast()
const open = ref(false)
const uploading = ref(false)

defineShortcuts({
  meta_enter: () => set(open, !get(open))
})

const schema = z.object({
  id: z.string("Please enter an ID"),
  tour: z.literal(["ATP", "WTA"], "Please select a tour")
})
type Schema = z.infer<typeof schema>

const state = reactive<Partial<Schema>>({})

const formFields: FormFieldInterface<Schema>[] = [
  { label: "ID", key: "id", type: "text", required: true },
  { label: "Tour", key: "tour", type: "radio", items: ["ATP", "WTA"], required: true }
]

const handleReset = () => {
  state.id = ""
  state.tour = "ATP"
}

const onError = (event: FormErrorEvent) => {
  toast.add({
    title: "Please ensure fields are filled out correctly",
    description: event.errors.map(e => e.message).join(", "),
    icon: icons.error,
    color: "error"
  })
}

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(uploading, true)
  try {
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
  } catch (e) {
    toast.add({
      title: "Error creating player",
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
        <div class="grid grid-cols-2 gap-5 items-center">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field
            v-model="state[field.key]"
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
