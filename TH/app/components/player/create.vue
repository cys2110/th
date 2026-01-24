<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const {
  ui: { icons }
} = useAppConfig()
const toast = useToast()
const router = useRouter()

const isOpen = ref(false)
const isUploading = ref(false)

const state = ref<Partial<PlayerCreateSchema>>({})

const handleReset = () => set(state, {})

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<PlayerCreateSchema>) => {
  set(isUploading, true)

  await $fetch("/api/players/create", {
    method: "POST",
    body: event.data
  })
    .then(() => {
      toast.add({
        title: `${event.data.id} created successfully.`,
        icon: icons.success,
        color: "success"
      })

      router.push({
        name: "player",
        params: {
          id: event.data.id,
          name: "—"
        }
      })
    })
    .catch(error => {
      if (error.statusMessage) {
        console.error(error.statusMessage, error.data?.data)
      } else {
        console.error(error)
      }

      toast.add({
        title: `Error creating ${event.data.id}.`,
        description: error.statusMessage ?? "An unknown error occurred.",
        icon: icons.error,
        color: "error"
      })
    })
    .finally(() => {
      set(isUploading, false)
    })
}

const formFields: FormFieldInterface<PlayerCreateSchema>[] = [
  { label: "ID", key: "id", type: "text", required: true, icon: ICONS.profile },
  { label: "Tour", key: "tour", type: "radio", items: ["ATP", "WTA"], required: true, icon: ICONS.tour }
]
</script>

<template>
  <u-modal
    :title="`Create ${state.id || 'Player'}`"
    v-model:open="isOpen"
  >
    <u-button
      label="Create Player"
      color="warning"
      block
      :icon="icons.plus"
    />

    <template #body>
      <u-form
        id="player-form"
        :schema="playerCreateSchema"
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 gap-3 items-center">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field
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
          form="player-form"
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
