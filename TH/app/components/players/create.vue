<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const {
  ui: { icons }
} = useAppConfig()
const toast = useToast()
const router = useRouter()

const open = ref(false)
const uploading = ref(false)

const initialState = {}
const state = ref<Partial<PlayerCreateSchema>>(cloneDeep(initialState))

const handleReset = () => set(state, cloneDeep(initialState))

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<PlayerCreateSchema>) => {
  set(uploading, true)

  await $fetch("/api/players/create", {
    method: "POST",
    body: event.data
  })
    .then(response => {
      toast.add({
        title: `${event.data.id} created successfully`,
        icon: icons.success,
        color: "success"
      })

      handleReset()
      set(open, false)

      router.push({ name: "player", params: { id: event.data.id, name: "—" } })
    })
    .catch(error => {
      if (error.statusMessage === "Validation errors") {
        console.error(error.statusMessage, error.data?.data.validationErrors)
      } else {
        console.error(error)
      }

      toast.add({
        title: `Error creating ${event.data.id}`,
        description: error.statusMessage ?? "An unknown error occurred",
        icon: icons.error,
        color: "error"
      })
    })
}

const formFields: FormFieldInterface<PlayerCreateSchema>[] = [
  { label: "ID", key: "id", type: "text", required: true },
  { label: "Tour", key: "tour", type: "radio", items: ["ATP", "WTA"], required: true, icon: ICONS.tour }
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
      color="warning"
      block
    />

    <template #body>
      <u-form
        id="player-form"
        :schema="playerCreateSchema"
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
        color="success"
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
